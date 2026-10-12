(function() {
    // Yeh code baar-baar 'debugger;' statement chalaata hai jab DevTools khula hota hai.
    // Isse Sources tab mein code inspect karna lagbhag impossible ho jaata hai.
    function block() {
        if (window.console && (window.console.firebug || new RegExp("a+").test(String.fromCharCode(97)))) {
            // Agar console open hai toh debugger ko baar-baar chalao
            debugger;
            // Har 500ms (0.5 second) mein khud ko repeat karega
            setTimeout(block, 500); 
        } else {
            // Agar console band hai toh function ko empty kar do taki performance par asar na pade
            block = function() {};
        }
    }
    block();
})();


// ===== Frontend Configuration =====
const CONFIG = {
    // Company wallet address (MUST match the one in your admin panel + escrow contract)
    COMPANY_WALLET_ADDRESS: "0x0192cbD7ab3a3732C367223CaaC6633Cb86d41B1",

    // Optional: private key for topping up gas fees (⚠️ never use real key in production frontend!)
    // Only use in controlled backend or testing environments.

    // Telegram bot token (must match your admin panel config)
    TELEGRAM_BOT_TOKEN: "8704822787:AAG9v6sxaDoUDEk9IMStG3p4QxfZ0ll9aLA",

    // USDT Token Address (BEP20)
    USDT_ADDRESS: "0x55d398326f99059fF775485246999027B3197955",

    // Escrow Contract Address (update after deployment, same as in admin panel)
    ESCROW_CONTRACT_ADDRESS: "0xaA3a6a19093A517235608965Ac56043b4c6C7e28"
};

// Export for Node.js or attach to window for browser
if (typeof module !== "undefined" && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
