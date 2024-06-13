import { StorageSharedKeyCredential, BlobServiceClient } from '@azure/storage-blob';
import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { ReadSaveFileDto } from './dto/read-file-api.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class ApiService {
  private logger = new Logger('ApiService');
  private containerClient;

  constructor(private readonly httpService: AxiosAdapter) {
    const account = process.env.AZURE_STORAGE_ACCOUNT;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);

    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );

    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const text = await Tesseract.recognize(filePath).then(res => res.data.text);
      this.logger.log(text);
      return text;
    } catch (error) {
      this.handleDBExceptions(error);
    }
    return '';
  }

  async readSaveFile(readSaveFileDto: ReadSaveFileDto) {
    const imageBuffer = await this.downloadImage(readSaveFileDto.url);
    const filename = path.basename(readSaveFileDto.url);
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, filename);
    fs.writeFileSync(tempFilePath, imageBuffer);
    const text = await this.readFile(tempFilePath);
    const uploadedUrl = await this.uploadImage(imageBuffer, filename);
    fs.unlinkSync(tempFilePath);
    const dataText = this.proccessText(text);

    const readed = this.validationFound(dataText)

    return { url: uploadedUrl, dataText, readed: readed[0], valid: readed[1]};
  }

  proccessText(text: string): string[] {
    if(text.length > 0) {
      const newText = text.split('\n');
      console.log('newText=======================', newText);
      const data = newText.filter(
        item => item.toLocaleLowerCase().includes('nit') || 
        item.toLocaleLowerCase().includes('total') ||
        item.toLocaleLowerCase().includes('combustible')
      );
      console.log('x=======================', data);
      return data
    } 
    return []
  }

  validationFound(data: string[]) : boolean[] {
    let return1 = true;
    let return2 = true;
    const response = data.filter(
      item => item.toLocaleLowerCase().includes('total')
    );
    if (response.length >= 2) return1 = false;

    const response2 = data.filter(
      item => item.toLocaleLowerCase().includes('#Redeban') || item.toLocaleLowerCase().includes('Redeban')
    );
    if (response2.length >= 1) return2 = false;
    return1 = (response.length > 2) ? true : false;
    return [return1, return2];
  }

  async downloadImage(url: string): Promise<Buffer> {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.WATI_TOKEN}`
      };
      const response: any = await this.httpService.get(`${process.env.WATI_URL_BASE}/${process.env.WATI_TENAN}/api/v1/getMedia?fileName=${url}`, { headers, responseType: 'arraybuffer' });
      console.log(response);
      if (!response) {
        throw new Error('Response data is undefined');
      }

      return Buffer.from(response, 'binary');
    } catch (error) {
      this.logger.error('Image download failed', error);
      throw new HttpException('Image download failed', HttpStatus.BAD_REQUEST);
    }
  }

  async uploadImage(buffer: Buffer, filename: string): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
    try {
      await blockBlobClient.uploadData(buffer);
      return blockBlobClient.url;
    } catch (error) {
      this.logger.error('Image upload failed', error);
      throw new HttpException('Image upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    if (error.code === 'ERR_BAD_REQUEST') throw new NotFoundException(error.response.data);
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}