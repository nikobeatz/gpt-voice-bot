import {Configuration, OpenAIApi} from 'openai';
import config from 'config';
import {createReadStream} from 'fs';

class OpenAI {
    constructor() {
        const configuration = new Configuration({
            apiKey: config.get('OPEN_AI_KEY'),
            organization: 'org-opZkEwA9TWKOl5fikHNSWZvq'
        })
        this.openai = new OpenAIApi(configuration);
    }

    async chat(messages) {
        try {
            const res = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages
            })
            return res.data.choices[0].message
        } catch (error) {
            console.log("Error while chat completion:", error?.message || error);
        }
    }

    async transcription(filePath) {
        try {
            const res = await this.openai.createTranscription(createReadStream(filePath), 'whisper-1');
            return res?.data?.text
        } catch (error) {
            console.log("Error while transcription voice:", error?.message || error);
        }
    }
};

export const openAI = new OpenAI();