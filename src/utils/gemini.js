import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI("AIzaSyCxQ_okmKpBt_8ljSwWXLKrAxtr-3cSApA");

// This converts the local file object into Base64 so the Cloud API can "see" it
const fileToDataPart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({
      inlineData: {
        data: reader.result.split(',')[1],
        mimeType: file.type
      },
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzePatientHistory = async (patientData, recordsList, files = []) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a senior medical AI. Analyze this patient's data and the attached medical reports:
      Patient: ${patientData.fullName}, Age: ${patientData.age}
      
      Tasks:
      1. If images/PDFs are attached, read the clinical values (e.g., RBC count, X-ray findings).
      2. Combine these values with the record titles: ${recordsList}.
      3. Provide a 3-sentence summary of the current health status and any urgent risks.
      
      Keep it professional and under 70 words.
    `;

    // We send the text prompt AND the converted image data
    const imageParts = await Promise.all(files.map(fileToDataPart));
    
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "AI could not process the visual content. Please check file format.";
  }
};

export const checkSymptoms = async (chatHistory) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      You are an interactive AI Health Assistant in a patient dashboard.
      The patient is consulting you about their symptoms.

      CRITICAL RULES:
      1. You must assess if the patient has provided all of the following:
         - Body temperature
         - Approximate weight
         - Recent food/drink consumptions
      2. If ANY of these three details are missing from the conversation history, politely ASK the patient for them before predicting symptoms. Do not provide a diagnosis until you have this info.
      3. Once you have this info (or if they are already provided in the chat), predict the possible symptoms and possible diseases/conditions based on their description.
      4. Guide the patient on exactly what and how they should describe their condition to the doctor.
      5. Keep responses empathetic, conversational, and under 100 words per reply. format with newlines and avoid gigantic paragraphs.
      6. ALWAYS include a brief medical disclaimer.

      ${chatHistory.map(msg => msg.role + ': ' + msg.text).join('\\n')}
      Respond as the AI Health Assistant:
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Symptom Checker Error:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
};