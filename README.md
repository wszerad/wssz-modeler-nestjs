# @wssz/modeler-nestjs
Plugin for [@wssz/modeler](https://github.com/wszerad/wssz-modeler) and [NestJS](https://github.com/nestjs/nest), introduce support for @nestjs/swagger and ModelerPipe with validation and object casting.

## Usage
```typescript

class AnyDto {
    @Prop() id: string;

    @Prop() date: Date;

    @Nullable()
    @Prop() otherDto: OtherDto;
}

```

* ModelerPipe(`errorHandler`: (errors: ModelerPipeError) => any, `customTransforms`, `modelerParserOptions`, `ajvOptions`)
    * custom handler with `ModelerPipeError` and optional  or throw BadRequestException if not specified                                                                                                                                                                                                                                                          >.
    * customTransforms - `[any, TypeTransform][]`
    * modelerParserOptions = `null` - to disable parser
    * [ajvOptions](https://github.com/epoberezkin/ajv#options) = `null` - to disable ajv based validation 

```typescript
@Post()
@UsePipes(new ModelerPipe())
async create(@Body() anyDto: AnyDto) { ... }
```
## Extend Swagger models
```typescript
// inside nestjs bootstrap
const document = ModelerNestjs.extend(SwaggerModule.createDocument(app, options));
SwaggerModule.setup('docs', app, document);
```

## Definitions

* ModelerPipeError - default validation error input
```typescript
interface ModelerPipeError {
	metatype: string;
	message: string;
	ajvErrors?: ajv.ErrorObject[];
}
```
see more about [Ajv.ValidateError](https://github.com/epoberezkin/ajv#validation-errors)

* TypeTransform - custom type transformer definition (for `String`, `Number`, `Boolean`, `Date` already defined)
```typescript
export interface TypeTransform {
	validator: (value: any) => string | false;
	parser: (value: any) => any;
}

// EXAMPLE
const customTransforms = [
    [String, {
        validator() {
            return !!v ? false : 'Validation error message';
        },
        parser(v) {
            return String(v);
        }
    }],
    // ...
];
new ModelerPipe(null, customTransforms);
```