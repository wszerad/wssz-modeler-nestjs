import { SwaggerDocument } from '@nestjs/swagger';
import { modelerDtos } from './ModelerDto';
import { ModelerJsonSchema } from '@wssz/modeler-jsonschema';

export class ModelerNestjs {
	static extend(document: SwaggerDocument): SwaggerDocument  {
		if (document.definitions) {
			const definitions = new Map<string, object>();

			Object.keys(document.definitions).forEach(model => {
				resolveDependencies(definitions, model);
			});

			Array
				.from(definitions.entries())
				.reduce((definitions, [key, schema]) => {
					return Object.assign(definitions, {
						[key]: schema
					});
				}, document.definitions);
		}

		return document;
	}
}

function resolveDependencies(definitions: Map<string, object>, schemaName: string, model?: Function) {
	if ((model || modelerDtos.has(schemaName)) && !definitions.has(schemaName)) {
		const modelerSchema = ModelerJsonSchema.create(model || modelerDtos.get(schemaName));
		definitions.set(schemaName, modelerSchema.getSchema());

		modelerSchema
			.getDependencies()
			.forEach(dep => resolveDependencies(definitions, dep.name, dep));
	}
}