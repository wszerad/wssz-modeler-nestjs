import { Body, Controller, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiProperty, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Description, Enum, Example, Format, Formats, Nullable, Pattern, Prop, Required } from '@wssz/modeler';
import { expect } from 'chai';
import 'mocha';
import 'reflect-metadata';
import { ModelerDto } from '../src/ModelerDto';
import { ModelerNestjs } from '../src/ModelerNestjs';
import { ModelerPipe } from '../src/ModelerPipe';

class OtherClass {
	@Prop()
	pDate: Date;
}

@ModelerDto()
export class RequestModel {
	@Enum(['ww@ww.com', 'ww2@ww2.com']) @Format(Formats.Email)
	@Example('ww@ww.com') @Nullable() @Description('Some description')
	@Pattern(/.+/)
	@Prop() email: string;

	@ApiProperty({
		enum: ['ww@ww.com', 'ww2@ww2.com'], format: Formats.Email,
		example: 'ww@ww.com', nullable: true, description: 'Some description',
		pattern: '/.+/', type: 'string'
	})
	email2: string
}

@Controller('controller')
export class AppController {
	@Post('request')
	request(@Body() body: RequestModel) {}
}

@Module({
	imports: [],
	controllers: [AppController],
	providers: []
})
class AppModule {}

describe('tests', () => {
	describe('ModelerNestjs', () => {
		it('compare default output', async () => {
			const app = await NestFactory.create(AppModule);
			const options = new DocumentBuilder()
				.setTitle('Api').setVersion('1.0').addTag('tag').build();

			const def = SwaggerModule.createDocument(app, options);
			const document = ModelerNestjs.extend(JSON.parse(JSON.stringify(def)));

			// @ts-ignore
			expect(def.components.schemas.RequestModel.properties.email2)
				// @ts-ignore
				.to.eql(document.components.schemas.RequestModel.properties.email)
		});
	});

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