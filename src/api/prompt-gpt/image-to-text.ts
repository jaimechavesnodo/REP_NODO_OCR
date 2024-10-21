import OpenAI from "openai";
import { imageToTextPrompt } from "./texts/imageToText.prompt";

export const imageToText = async (openai: OpenAI, imageFile: string) => {
    const prompt = imageToTextPrompt();
    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo', //'gpt-4-vision-preview',
        max_tokens: 1000,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt ?? '¿Qué logras ver en la imagen?',
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${imageFile}` 
                        },
                    },
                ],
            },
        ],
    });

    return { msg: response.choices[0].message.content }
}