export const modelerDtos = new Map<string, Function>();

export function ModelerDto() {
	return (constructor: Function) => {
		modelerDtos.set(constructor.name, constructor);
	}
}