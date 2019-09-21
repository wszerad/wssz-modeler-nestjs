# @wssz/modeler-nestjs
Plugin for [@wssz/modeler](https://github.com/wszerad/wssz-modeler) and [NestJS](https://github.com/nestjs/nest), introduce support for @nestjs/swagger and ModelerPipe with validation and object casting.

## Usage

* @ModelerDto()
    *  implements Modeler decorators to work with Swagger docs

```ts

@ModelerDto()
class AnyDto {
    @Prop() id: string,

    @Prop() date: Date,

    @Nullable()
    @Prop() otherDto: OtherDto
}

```

* ModelerPipe(errorHandler?: (errors: Ajv.ValidateError[]) => any, modelerParserOptions, ajvOptions)
    * custom handler with [Ajv.ValidateError](https://github.com/epoberezkin/ajv#validation-errors) or throw BadRequestException
    * modelerParserOptions = null - to disable parser
    * [ajvOptions](https://github.com/epoberezkin/ajv#options) = null - to disable ajv based validation 

```ts
@Post()
@UsePipes(new ModelerPipe())
async create(@Body() anyDto: AnyDto) { ... }
```
