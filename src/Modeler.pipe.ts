import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { hasMarkers } from '@wssz/modeler';
import { ModelerJsonSchema } from '@wssz/modeler-jsonschema';
import { ModelerParser, ModelerParserOptions } from '@wssz/modeler-parser';
import Ajv, * as ajv from 'ajv';
import { basicTypesTransform, TypeTransform } from './basic-types-transform';

interface ModelerPipeError {
	metatype: string;
	message: string;
	ajvErrors?: ajv.ErrorObject[];
}

@Injectable()
export class ModelerPipe implements PipeTransform {
	private ajvInstance: ajv.Ajv;
	private registered = new Set<string>();
	private customTypes: Map<any, TypeTransform>;

	constructor(
		private errorHandler?: (error: ModelerPipeError) => any,
		customTypes: [any, TypeTransform][] = [],
		private parserOptions: ModelerParserOptions = {},
		private ajvOptions: ajv.Options = {
			nullable: true,
			removeAdditional: true,
			allErrors: true,
		}
	) {
		this.ajvInstance = ajvOptions ? new Ajv(ajvOptions) : null;
		this.customTypes = new Map<any, TypeTransform>([...basicTypesTransform, ...customTypes]);
	}

	transform(value: any, metadata: ArgumentMetadata) {
		const customTransform = this.customTypes.get(metadata.metatype);
		let error: ModelerPipeError;

		if (!customTransform && (!metadata.metatype || !metadata.metatype.prototype)) {
			return value;
		}

		if (customTransform) {
			const validationResult = customTransform.validator(value);
			error = validationResult ? this.generateErrorObject(validationResult, metadata) : null;
		} else if (hasMarkers(metadata.metatype)) {
			this.manageSchemas(metadata.metatype);

			if(this.ajvInstance && !this.ajvInstance.validate(`#/definitions/${metadata.metatype.name}`, value)) {
				error = this.generateErrorObject('', metadata, this.ajvInstance.errors);
			}
		} else {
			const readableMetatype = typeof metadata.metatype === 'function' ? metadata.metatype.name : String(metadata.metatype);
			throw new Error(`${metadata.type} with unknown metatype: ${readableMetatype}`);
		}

		if (error) {
			if (this.errorHandler) {
				return this.errorHandler(error);
			} else {
				throw new BadRequestException('Validation failed');
			}
		}

		if (customTransform) {
			return customTransform.parser(value);
		} else if (this.parserOptions) {
			return ModelerParser.parse(metadata.metatype, value, this.parserOptions);
		}

		return value;
	}

	private generateErrorObject(message: string, metadata: ArgumentMetadata, ajvErrors?: ajv.ErrorObject[]): ModelerPipeError {
		if (ajvErrors) {
			message = ajvErrors
				.map(error => {
					return `${error.dataPath} ${error.message}`;
				})
				.join(', ')
		}

		return {
			metatype: this.getNormalizedMetatype(metadata.metatype),
			message,
			ajvErrors
		};
	}

	private getNormalizedMetatype(metatype: any) {
		return typeof metatype === 'function' ? metatype.name : String(metatype);
	}

	private manageSchemas(model: Function) {
		if (!this.registered.has(model.name)) {
			const modelerSchema = ModelerJsonSchema.create(model);

			modelerSchema
				.getDependencies()
				.forEach(dep => this.manageSchemas(dep));

			this.registered.add(model.name);
			
			if (this.ajvInstance) {
				this.ajvInstance.addSchema(modelerSchema.getSchema(), `#/definitions/${model.name}`);
			}
		}
	}
}
