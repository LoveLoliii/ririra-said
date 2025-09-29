
const lalafellConfig = {
  appID: '',
  token: '',
  secret: '',
  intents: [
    AvailableIntentsEventsEnum.GUILD_MESSAGES,
    AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS,
    AvailableIntentsEventsEnum.DIRECT_MESSAGE,
    AvailableIntentsEventsEnum.GROUP_AND_C2C_EVENT
  ],
  sandbox: false, // optional, default false
  dsKey:'',
  volcesKey:''
};
const baseConfig = {
  robotId: '',
  robotGuildId: '',
  imgDir: '',
  datasetDir:'',
  fflogsClientID:'',
  fflogsClientSecret:''
};

const pixivConfig = {
  freshToken: '',
};
const openApiConfig = {
  chatgptToken: '',
};

// const mailConfig = {
//   host: secret.mail.host,
//   port: secret.mail.port,
//   secure: secret.mail.secure,
//   auth: {
//     user: secret.mail.auth.user,
//     pass: secret.mail.auth.pass,
//   },
//   logger: true,
//   transactionLog: true,
//   allowInternalNetworkInterfaces: false,
// };
export { lalafellConfig, baseConfig, pixivConfig, openApiConfig };


declare enum AvailableIntentsEventsEnum {
    GUILDS = "GUILDS",
    GUILD_MEMBERS = "GUILD_MEMBERS",
    GUILD_MESSAGES = "GUILD_MESSAGES",
    GUILD_MESSAGE_REACTIONS = "GUILD_MESSAGE_REACTIONS",
    DIRECT_MESSAGE = "DIRECT_MESSAGE",
    FORUMS_EVENT = "FORUMS_EVENT",
    AUDIO_ACTION = "AUDIO_ACTION",
    PUBLIC_GUILD_MESSAGES = "PUBLIC_GUILD_MESSAGES",
    MESSAGE_AUDIT = "MESSAGE_AUDIT",
    INTERACTION = "INTERACTION",
    GROUP_AND_C2C_EVENT = "GROUP_AND_C2C_EVENT"
}