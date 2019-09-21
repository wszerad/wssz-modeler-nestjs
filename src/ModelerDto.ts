import { ApiModelProperty } from '@nestjs/swagger';
import { ModelerJsonSchema } from '@wssz/modeler-jsonschema';

export function ModelerDto() {
	return (constructor) => {
		const model = ModelerJsonSchema.create(constructor);
		Object.entries(model.getSchema().properties)
			.forEach(([key, propSchema]) => {
				ApiModelProperty(propSchema)(constructor.prototype, key);
			});
	}
}