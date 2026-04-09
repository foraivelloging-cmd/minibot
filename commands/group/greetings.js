const {getGroupSettings}=require('../../database');module.exports={name:'greetings',aliases:[],category:'group',description:'Show greeting templates',usage:'.greetings',groupOnly:true,adminOnly:true,async execute(sock,msg,args,extra){try{const s=getGroupSettings(extra.from);await extra.reply(`📝 *Greetings Templates*

Welcome: ${s.welcomeMessage}
Goodbye: ${s.goodbyeMessage}

Variables: @user, @group`);}catch(e){await extra.reply(`❌ ${e.message}`);}}};