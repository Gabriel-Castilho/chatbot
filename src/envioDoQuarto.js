const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const quartos = require("./quartos");

const envioDeQuartos = (numero) => {
  for (const i in quartos) {
    console.log(`${i} ${quartos[i].titulo} ${quartos[i].descri}`);

    client.messages
      .create({
        body: `*${quartos[i].titulo}* \n${quartos[i].descri} `,
        mediaUrl: `${quartos[i].img}`,
        from: "whatsapp:+14155238886",
        to: `${numero}`,
      })
      .then((message) => console.log(`${message.sid}`));
  }
};
module.exports = { envioDeQuartos };
