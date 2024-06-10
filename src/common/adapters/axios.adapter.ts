import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';
import { HttpAdapter } from '../interfaces/http-adapter.interface';

@Injectable()
export class AxiosAdapter implements HttpAdapter {
    private axios: AxiosInstance = axios;
    async get<T>(url: string, headers?: any): Promise<T> {
        try {
            const { data } = await this.axios.get<T>(url, headers);
            return data;
        } catch (error) {
            throw new Error('This is an error - Check logs');
        }
    }
    async post<T>(url: string, request: object): Promise<T> {
        const { data } = await this.axios.post<T>(url, request);
        return data;
    }
}
