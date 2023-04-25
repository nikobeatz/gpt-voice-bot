import {Telegraf, session} from 'telegraf';
import {message} from 'telegraf/filters';
import {code} from 'telegraf/format';
import config from 'config';
import {converter} from './converter.js';
import {openAI} from './openai.js';

const INIT_SESSION = {
    messages: []
}

const bot = new Telegraf(config.get("TELEGRAM_KEY"));

bot.use(session());

bot.command('new', async (ctx) => {
    ctx.session = INIT_SESSION;
    await ctx.reply(`Здравствуйте, ${ctx.message.from.first_name}! Напишите текст или отправьте голосовое сообщение.`)
})

bot.command('start', async (ctx) => {
    ctx.session = INIT_SESSION;
    await ctx.reply(`Здравствуйте, ${ctx.message.from.first_name}! Напишите текст или отправьте голосовое сообщение.`)
})

bot.on(message('text'), async (ctx) => {
    ctx.session ? ctx.session : INIT_SESSION;
    try {
        await ctx.reply(code('Сообщение принято. Жду ответ от сервера ...'));

        ctx.session.messages.push({role: 'user', content: ctx.message.text})
        const gpt_response = await openAI.chat(ctx.session.messages);

        ctx.session.messages.push({role: 'assistant', content: gpt_response.content})

        await ctx.reply(gpt_response.content)
    } catch (error) {
        ctx.reply(`Error on text sending: ${error?.message || error}`)
    }
})

bot.on(message('voice'), async (ctx) => {
    ctx.session ? ctx.session : INIT_SESSION;
    try {
        await ctx.reply(code('Сообщение принято. Жду ответ от сервера ...'));
        const voiceFileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggPath = await converter.create(voiceFileLink.href, userId);
        const mp3Path = await converter.toMp3(oggPath, userId);

        const text = await openAI.transcription(mp3Path);
        await ctx.reply(code(`Ваш запрос: ${text}`));

        ctx.session.messages.push({role: 'user', content: text})
        const gpt_response = await openAI.chat(ctx.session.messages);

        ctx.session.messages.push({role: 'assistant', content: gpt_response.content})

        await ctx.reply(gpt_response.content)
    } catch (error) {
        ctx.reply(`Error on voice sending: ${error?.message || error}`)
    }
})

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));