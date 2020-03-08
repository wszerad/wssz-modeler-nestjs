export interface TypeTransform {
	validator: (value: any) => string | false;
	parser: (value: any) => any;
}

const forString: TypeTransform = {
	parser(v: any) {
		return String(v);
	},
	validator(v: any) {
		return v == null ? 'Data should be string' : false;
	}
};

const forNumber: TypeTransform = {
	parser(v: any) {
		return Number(v);
	},
	validator(v: any) {
		return isNaN(Number(v)) ? 'Data should be number' : false;
	}
};

const forBoolean: TypeTransform = {
	parser(v: any) {
		switch (v) {
			case 'true':
			case '1':
			case true:
			case 1:
				return true;
			case 'false':
			case '0':
			case false:
			case 0:
				return false;
			default:
				return undefined;
		}
	},
	validator(v: any) {
		return forBoolean.parser(v) === undefined
			? 'Data should be boolean'
			: false;
	}
};

const forDate: TypeTransform = {
	parser(v: any) {
		if (!forNumber.validator(v)) {
			return new Date(forNumber.parser(v));
		} else {
			return new Date(v);
		}
	},
	validator(v: any) {
		return forNumber.validator(v) || isNaN(Number(new Date(v)))
			? 'Data should be \'date\' format'
			: false;
	}
};

export const basicTypesTransform: [any, TypeTransform][] = [
	[String, forString],
	[Number, forNumber],
	[Boolean, forBoolean],
	[Date, forDate]
];