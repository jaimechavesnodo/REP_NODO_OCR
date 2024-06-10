import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class ReadFileDto {
    @ApiProperty({
        example: 'File.jpg',
        description: 'File to read',
    })
    @IsNotEmpty()
    file: Express.Multer.File
}

export class ReadSaveFileDto {
    @ApiProperty({
        example: 'data/example.jpg',
        description: 'Route to read file',
    })
    @IsNotEmpty()
    url: string

    @ApiProperty({
        example: '123',
        description: 'user id to asign file'
    })
    @IsOptional()
    userId: number
}

export class ErrorResponseDto {
    @ApiProperty({
        example: 'Internal error in service, check logs',
        description: 'Mensaje de error',
    })
    message: string;

    @ApiProperty({ example: 'Bad Request', description: 'Tipo de error' })
    error: string;

    @ApiProperty({ example: 400, description: 'Código de estado HTTP' })
    statusCode: number;
}
