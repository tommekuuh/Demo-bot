// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, CardFactory } = require('botbuilder');
const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');

class DispatchBot extends ActivityHandler {
    constructor() {
        super();

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }`
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        const qnaMaker2 = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId2,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        const qnaMaker3 = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId3,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });

        this.dispatchRecognizer = dispatchRecognizer;
        this.qnaMaker = qnaMaker;
        this.qnaMaker2 = qnaMaker2;
        this.qnaMaker3 = qnaMaker3;

        this.onMessage(async (context, next) => {
            console.log('Processing Message Activity.');

            // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
            const recognizerResult = await dispatchRecognizer.recognize(context);

            // Top intent tell us which cognitive service to use.
            const intent = LuisRecognizer.topIntent(recognizerResult);

            // Next, we call the dispatcher with the top intent.
            await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const welcomeText = 'Typ je vraag en we beginnen.';
            const membersAdded = context.activity.membersAdded;

            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welkom bij de Acknowledge-Assistant ${ member.name }. ${ welcomeText }`);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async dispatchToTopIntentAsync(context, intent, recognizerResult) {
        switch (intent) {
        case 'q_verkoop-kb':
            await this.processq_verkoop_KB(context);
            break;
        case 'q_service-kb':
            await this.processq_service_KB(context);
            break;
        case 'q_logistiek-kb':
            await this.processq_logistiek_KB(context);
            break;
        default:
            console.log(`Dispatch unrecognized intent: ${ intent }.`);
            await context.sendActivity(`Dispatch unrecognized intent: ${ intent }.`);
            break;
        }
    }

    async processq_verkoop_KB(context) {
        console.log('processq_verkoop_KB');

        const results = await this.qnaMaker.getAnswers(context);

        if (results.length > 0) {
            await context.sendActivity(`${ results[0].answer }`);
        } else {
            await context.sendActivity('Sorry, could not find an answer in the verkoop.');
        }
    }
    async processq_logistiek_KB(context) {
        console.log('processq_logistiek_KB');

        const results2 = await this.qnaMaker2.getAnswers(context);

        if (results2.length > 0) {
            await context.sendActivity(`${ results2[0].answer }`);
        } else {
            await context.sendActivity('Sorry, could not find an answer in the logistiek.');
        }
    }
    async processq_service_KB(context) {
        console.log('processq_service_KB');

        const results3 = await this.qnaMaker3.getAnswers(context);

        if (results3.length > 0) {
            await context.sendActivity(`${ results3[0].answer }`);
        } else {
            await context.sendActivity('Sorry, could not find an answer in the service.');
        }
    }
}

module.exports.DispatchBot = DispatchBot;
