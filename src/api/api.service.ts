import { StorageSharedKeyCredential, BlobServiceClient } from '@azure/storage-blob';
import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';
import { ReadSaveFileDto } from './dto/read-file-api.dto';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { imageToText } from './prompt-gpt/image-to-text'
import * as exifremove from 'exifremove';

@Injectable()
export class ApiService {
  private logger = new Logger('ApiService');
  private containerClient;
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

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

  async readSaveFile(readSaveFileDto: ReadSaveFileDto) {
    const imageBuffer = await this.downloadImage(readSaveFileDto.url);
    const cleanImageBuffer = exifremove.remove(imageBuffer);

    const processedImageBuffer = await sharp(cleanImageBuffer)
      .resize({ width: 800 })
      .jpeg({ quality: 80 })
      .toBuffer();

    const filename = path.basename(readSaveFileDto.url, path.extname(readSaveFileDto.url)) + '.jpeg';
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, filename);
    fs.writeFileSync(tempFilePath, processedImageBuffer); 

    const uploadedUrl = await this.uploadImage(processedImageBuffer, filename);
    console.log(uploadedUrl);

    const base64Image = processedImageBuffer.toString('base64');

    const text = await imageToText(this.openai, base64Image);

    fs.unlinkSync(tempFilePath);

    
    let data: any;
    if (text.msg.includes('Redeban')) {
      return data = {
        "commerce": "Redeban",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "0",
        "produc": "",
        "read": "false",
        "url": uploadedUrl
      }
    }
    if (text.msg.startsWith("```json")) {
      try {
        const jsonString = text.msg.replace(/```json\n/, '').replace(/\n```$/, '');
        data = JSON.parse(jsonString);
        console.log(data, this.validation(data), data.nit.replace(/[^0-9]/g, '').includes('22222222'))
        if ( this.validation(data) || data.nit.replace(/[^0-9]/g, '').includes('22222222') ) {
          return data = { ...data, total: (data.total == '') ? '0' : this.cleanNumberString(data.total), commerce: '', read: false,  "url": uploadedUrl };
        }
        return data = { ...data, total: (data.total == '') ? '0' : this.cleanNumberString(data.total), commerce: '', read: "true",  "url": uploadedUrl }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      return data = {
        "commerce": "",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "0",
        "produc": "",
        "read": "false",
        "url": uploadedUrl
      }
    }

    console.log(text);
    return { "url": uploadedUrl, ...data };
  }

  async readSaveFile2(readSaveFileDto: ReadSaveFileDto) {

    const uploadedUrl = readSaveFileDto.url;
    console.log(uploadedUrl)
    const text = await imageToText(this.openai, uploadedUrl);

    console.log(uploadedUrl)
    
    let data: any;
    if (text.msg.includes('Redeban')) {
      return data = {
        "commerce": "Redeban",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "0",
        "produc": "",
        "read": "false",
        "url": uploadedUrl
      }
    }
    if (text.msg.startsWith("```json")) {
      try {
        const jsonString = text.msg.replace(/```json\n/, '').replace(/\n```$/, '');
        data = JSON.parse(jsonString);
        console.log(data)
        if ( this.validation(data) || data.nit.replace(/[^0-9]/g, '').includes('22222222') ) {
          return data = { ...data, total: (data.total == '') ? '0' : this.cleanNumberString(data.total), commerce: '', read: false,  "url": uploadedUrl };
        }
        return data = { ...data, total: (data.total == '') ? '0' : this.cleanNumberString(data.total), commerce: '', read: "true",  "url": uploadedUrl }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      return data = {
        "commerce": "",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "0",
        "produc": "",
        "read": "false",
        "url": uploadedUrl
      }
    }

    return { "url": uploadedUrl, ...data };
  }

  async readSaveFile3(readSaveFileDto: ReadSaveFileDto) {
    const filename = this.getIdFromUrl(readSaveFileDto.url);
    const imageBuffer = await this.downloadImage2(filename);
    const cleanImageBuffer = exifremove.remove(imageBuffer);

    const processedImageBuffer = await sharp(cleanImageBuffer)
      .resize({ width: 800 })
      .jpeg({ quality: 80 })
      .toBuffer();
    console.log(filename);
    console.log('----------------------------------------------------------------')
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    console.log('----------------------------------------------------------------')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const tempFilePath = path.join(uploadsDir, filename);
    fs.writeFileSync(tempFilePath, processedImageBuffer);
    const uploadedUrl = await this.uploadImage(processedImageBuffer, filename);
    const base64Image = processedImageBuffer.toString('base64');
    const text = await imageToText(this.openai, base64Image);
    fs.unlinkSync(tempFilePath);

    console.log(uploadedUrl)
    console.log('----------------------------------------------------------------')
    let data: any;
    if (text.msg.includes('Redeban')) {
      return data = {
        "commerce": "Redeban",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "0",
        "produc": "",
        "read": "false",
        "url": uploadedUrl
      }
    }
    if (text.msg.startsWith("```json")) {
      try {
        const jsonString = text.msg.replace(/```json\n/, '').replace(/\n```$/, '');
        data = JSON.parse(jsonString);
        console.log(data, this.validation(data), data.nit.replace(/[^0-9]/g, '').includes('22222222'))
        if ( this.validation(data) || data.nit.replace(/[^0-9]/g, '').includes('22222222') ) {
          return data = { ...data, total: (data.total == '') ? '0' : this.cleanNumberString(data.total), commerce: '', read: false,  "url": uploadedUrl };
        }
        return data = { ...data, total: (data.total == '') ? '0' : this.cleanNumberString(data.total), commerce: '', read: "true",  "url": uploadedUrl }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      return data = {
        "commerce": "",
        "numberInvoice": "",
        "date": "",
        "nit": "",
        "total": "0",
        "produc": "",
        "read": "false",
        "url": uploadedUrl
      }
    }

    console.log(text);
    return { "url": uploadedUrl, ...data };
  }

  validation(data: any) {
    console.log(data);
    console.log(Number(this.cleanNumberString(data.total)))
    console.log(data.total.length)
    return (
      data.total == ""
      || data.nit == ""
      || data.product == ""
      || Number(this.cleanNumberString(data.total)) < 20000
      || Number(this.cleanNumberString(data.total)) > 500000
    )
  }


  cleanNumberString(input: string): string {
    // Eliminar todos los caracteres que no sean números, comas o puntos
    const cleanedInput = input.replace(/[^0-9,\.]/g, '');
    const firstChar = cleanedInput.match(/[.,]/)[0];
    if (firstChar === ',') {
      let inputSplit = cleanedInput.split('.');
      let cleaned = inputSplit[0].replace(/\,/g, '');
      console.log(cleaned)
      console.log('----------------------------------------------------------------')
      return cleaned.replace(/[^0-9]/g, '');
    } else {
      let inputSplit = cleanedInput.split(',');
      let cleaned = inputSplit[0].replace(/\./g, '');
      console.log(cleaned)
      console.log('----------------------------------------------------------------')
      return cleaned.replace(/[^0-9]/g, '');
    }
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

  async downloadImage2(id: string): Promise<Buffer> {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.WATI_TOKEN}`
      }; 
      const response: any = await this.httpService.get(`https://drive.usercontent.google.com/download?id=${id}&authuser=0`, { headers, responseType: 'arraybuffer' });
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
  getIdFromUrl(url: string): string | null {
    const regex = /[?&]id=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    if (error.code === 'ERR_BAD_REQUEST') throw new NotFoundException(error.response.data);
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}