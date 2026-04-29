import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { createServerFn } from "@tanstack/react-start";

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.POLLY_ACCESS_KEY!,
    secretAccessKey: process.env.POLLY_SECRET_KEY!,
  },
});

function formatJyutpingForPolly(sentence: string): string {
  const words = sentence.split(" ");
  const wrappedWords = words.map(word => {
    // Remove punctuation like "?" for the "ph" attribute but keep it in the text if needed
    const cleanWord = word.replace(/[?.!,]/g, "");
    return `<phoneme alphabet="x-amazon-jyutping" ph="${cleanWord}">${word}</phoneme>`;
  });
  
  return `<speak>${wrappedWords.join(" ")}</speak>`;
}

export const getCantoneseAudio = createServerFn({ method: "POST" })
  .inputValidator((jyutping: string) => jyutping)
  .handler(async ({ data: jyutping }) => {

    // 1. Construct SSML (the same format we tested in the console)
    const ssml = formatJyutpingForPolly(jyutping);
    console.log(ssml)
    const command = new SynthesizeSpeechCommand({
      Engine: "neural",
      LanguageCode: "yue-CN", // Crucial: Hiujin uses yue-CN
      OutputFormat: "mp3",
      Text: ssml,
      TextType: "ssml",
      VoiceId: "Hiujin",
    });

    try {
      const response = await pollyClient.send(command);
      
      // 2. Convert the stream to a Buffer then to Base64 so we can send it to the browser
      const audioByteArray = await response.AudioStream?.transformToByteArray();
      if (!audioByteArray) throw new Error("Failed to generate audio stream");
      
      const base64Audio = Buffer.from(audioByteArray).toString("base64");
      return `data:audio/mp3;base64,${base64Audio}`;
    } catch (error) {
      console.error("Polly Error:", error);
      throw new Error("Speech synthesis failed");
    }
  });