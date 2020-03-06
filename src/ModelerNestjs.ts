import { OpenAPIObject } from '@nestjs/swagger';
import { hasMarkers } from '@wssz/modeler';
import { ModelerJsonSchema } from '@wssz/modeler-jsonschema';

export class ModelerNestjs {
	static extend(document: OpenAPIObject): OpenAPIObject  {
		if (document.components && document.components.schemas) {
			const definitions = new Map<string, object>();

			Object.keys(document.components.schemas).forEach(model => {
				resolveDependencies(definitions, model);
			});

			Array
				.from(definitions.entries())
				.reduce((definitions, [key, schema]) => {
					return Object.assign(definitions, {
						[key]: schema
					});
				}, document.components.schemas);
		}

		return document;
	}
}

function resolveDependencies(definitions: Map<string, object>, schemaName: string, model?: Function) {
	if (!definitions.has(schemaName) && hasMarkers(schemaName)) {
		const modelerSchema = ModelerJsonSchema.create(schemaName, {useNullable: true});
		definitions.set(schemaName, modelerSchema.getSchema());

		modelerSchema
			.getDependencies()
			.forEach(dep => resolveDependencies(definitions, dep.name, dep));
	}
}