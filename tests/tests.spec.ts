import 'mocha';
import 'reflect-metadata';
import { expect } from 'chai';
import { Prop, Nullable } from '@wssz/modeler';
import { ModelerPipe } from '../src/ModelerPipe';

class OtherClass {
	@Prop()
	pDate: Date;
}

describe('tests', () => {
	describe('ModelerPipe', () => {
		const validationPipe = new ModelerPipe(errors => errors, null);
		const parserPipe = new ModelerPipe(errors => errors, {}, null);

		it('should return error', () => {
			class InvalidType {
				@Prop()
				pNumber: number;
			}

			expect(
				validationPipe.transform({ pNumber: 'string'}, {metatype: InvalidType, type: 'body', data: null})
			).to.eql([{
				'dataPath': '.pNumber',
				'keyword': 'type',
				'message': 'should be number',
				'params': {
					'type': 'number'
				},
				'schemaPath': '#/properties/pNumber/type'
			}]);
		});

		it('should return error for nest object', () => {
			class InvalidNestedType {
				@Prop()
				pOther: OtherClass;
			}

			expect(
				validationPipe.transform({ pOther: { pDate: 'string'}}, {metatype: InvalidNestedType, type: 'body', data: null})
			).to.eql([
				{
					'dataPath': '.pOther.pDate',
					'keyword': 'format',
					'message': 'should match format "date"',
					'params': {
						'format': 'date'
					},
					'schemaPath': '#/definitions/OtherClass/properties/pDate/format'
				}
			]);
		});

		it('should pass nullable', () => {
			class ValidNullType {
				@Prop()
				@Nullable()
				pDate: Date;
			}

			expect(
				validationPipe.transform({ pDate: null}, {metatype: ValidNullType, type: 'body', data: null})
			).to.eql({pDate: null});
		});

		it('should pass nullable object', () => {
			class ValidNullObjectType {
				@Prop()
				@Nullable()
				pOther: OtherClass;
			}

			expect(
				validationPipe.transform({ pOther: null}, {metatype: ValidNullObjectType, type: 'body', data: null})
			).to.eql({pOther: null});
		});

		it('should parse input', () => {
			const date = new Date();
			class CastableInput {
				@Prop()
				pOther: OtherClass;
			}

			expect(
				parserPipe.transform(JSON.parse(JSON.stringify({ pOther: { pDate: date}})), {metatype: CastableInput, type: 'body', data: null})
			).to.eql({ pOther: { pDate: date }});
		});
	});
});