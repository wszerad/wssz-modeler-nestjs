import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ModelerJsonSchema } from '@wssz/modeler-jsonschema';
import { ModelerParser, ModelerParserOptions } from '@wssz/modeler-parser';
import * as Ajv from 'ajv';

@Injectable()
export class ModelerPipe implements PipeTransform {
	private ajvInstance: Ajv.Ajv;
	private registered = new Set<string>();

	constructor(
		private errorHandler?: (errors: Ajv.ErrorObject[]) => any,
		private parserOptions: ModelerParserOptions = {},
		private ajvOptions: Ajv.Options = {
			nullable: true,
			removeAdditional: true,
			allErrors: true,
		}
	) {
		this.ajvInstance = new Ajv(ajvOptions);
	}

	transform(value: any, metadata: ArgumentMetadata) {
		if (!metadata.metatype || !metadata.metatype.prototype) {
			return value;
		}

		if (this.ajvOptions) {
			this.manageSchemas(metadata.metatype);

			if(!this.ajvInstance.validate(metadata.metatype.name, value)) {
				if (!this.errorHandler) {
					throw new BadRequestException('Validation failed');
				}

				return this.errorHandler(this.ajvInstance.errors);
			}
		}

		if (this.parserOptions) {
			return ModelerParser.parse(metadata.metatype, value, this.parserOptions);
		}

		return value;
	}

	private manageSchemas(model: Function) {
		if (!this.registered.has(model.name)) {
			const modelerSchema = ModelerJsonSchema.create(model);

			modelerSchema
				.getDependencies()
				.forEach(dep => this.manageSchemas(dep));

			this.registered.add(model.name);
			this.ajvInstance.addSchema(modelerSchema.getSchema(), model.name);
		}
	}
}
