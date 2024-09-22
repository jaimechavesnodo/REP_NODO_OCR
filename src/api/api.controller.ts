import { Controller, Get, Post, Body, UseInterceptors, HttpException, HttpStatus, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, ParseFilePipeBuilder } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto, ReadFileDto, ReadSaveFileDto } from './dto/read-file-api.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@ApiTags('Api-Confecamaras')
@Controller('api')
@UseInterceptors(FileInterceptor('file', { storage: diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
})}))
export class ApiController {
  constructor(private readonly apiService: ApiService) { }

  @Post('readSaveFile')
  @ApiResponse({ status: 200, description: 'File read and saved', type: ReadSaveFileDto })
  @ApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  async readSaveFile(@Body() readSaveFileDto: ReadSaveFileDto) {
    return this.apiService.readSaveFile(readSaveFileDto);
  }

  @Post('readSaveFile2')
  @ApiResponse({ status: 200, description: 'File read and saved', type: ReadSaveFileDto })
  @ApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  async readSaveFile2(@Body() readSaveFileDto: ReadSaveFileDto) {
    return this.apiService.readSaveFile2(readSaveFileDto);
  }

  @Post('readSaveFile3')
  @ApiResponse({ status: 200, description: 'File read and saved', type: ReadSaveFileDto })
  @ApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  async readSaveFile3(@Body() readSaveFileDto: ReadSaveFileDto) {
    return this.apiService.readSaveFile3(readSaveFileDto);
  }

  @Get()
  checkService() {
    throw new HttpException("ok", HttpStatus.OK);
  }

}
