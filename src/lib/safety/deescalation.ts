import { LanguageCode } from "@/types/database";

export const DEESCALATION_MESSAGES: Record<LanguageCode, string> = {
  en: "I can hear how much pain and heaviness you are carrying right now, and I care about your safety. Because I am an AI, I cannot give you the hands-on care and safety you deserve in this moment. Please connect with someone who can support you right now, or call the 24/7 Tele-MANAS helpline at 14416 (India) or 988 (USA/Canada). You don't have to carry this alone.",
  hinglish: "Main mehsoos kar sakta hoon ki aap is waqt kitne gehre dard aur takleef se guzar rahe hain. Aapki safety sabse pehle hai. Main ek AI hoon, isliye is moment mein jo emergency support aapko chahiye, wo main akele nahi de sakta. Please kisi apne se baat kijiye ya turant Tele-MANAS helpline par 14416 (India) par call karein. Ye 24/7 free aur confidential hai. Aap akele nahi hain.",
  hi: "मैं समझ सकता हूँ कि आप इस समय बहुत गहरे दर्द और भारीपन से गुज़र रहे हैं। आपकी सुरक्षा सबसे महत्वपूर्ण है। मैं केवल एक AI हूँ, इसलिए इस नाज़ुक समय में जो वास्तविक मदद आपको मिलनी चाहिए, वह मैं अकेले प्रदान नहीं कर सकता। कृपया अभी किसी अपने से बात करें या टेली-मानस (Tele-MANAS) हेल्पलाइन 14416 पर कॉल करें। यह 24 घंटे निःशुल्क और गोपनीय है। आप अकेले नहीं हैं।",
};

export const HARMFUL_ADVICE_REFUSALS: Record<LanguageCode, string> = {
  en: "I cannot provide instructions, methods, or suggestions that could lead to self-harm or injury. Your life and safety matter deeply. Please connect with someone who can support you right now, or call the 24/7 Tele-MANAS helpline at 14416 (India) or 988 (USA/Canada). Help is always available.",
  hinglish: "Main aisi koi bhi jankari ya tarika provide nahi kar sakta jisse kisi ko ya aapko chot pahuche. Aapki jaan aur safety sabse pehle hai. Please kisi apne se baat kijiye ya turant 24/7 Tele-MANAS helpline 14416 par call karein. Aap akele nahi hain.",
  hi: "मैं स्वयं को या किसी को भी नुकसान पहुँचाने वाले किसी भी तरीके या निर्देश की जानकारी प्रदान नहीं कर सकता। आपकी जान और सुरक्षा अत्यंत महत्वपूर्ण है। कृपया अभी किसी अपने से बात करें या निःशुल्क टेली-मानस हेल्पलाइन 14416 पर संपर्क करें।",
};

export const PROMPT_INJECTION_REFUSALS: Record<LanguageCode, string> = {
  en: "I am Sukoon AI, a reflective emotional companion. I operate under fixed ethical and non-clinical boundaries. I cannot follow instructions to override safety protocols, pretend to be a licensed doctor or psychiatrist, or diagnose conditions. I am here if you would like to talk through your everyday feelings.",
  hinglish: "Main Sukoon AI hoon, ek empathetic reflective companion. Main safe non-clinical guidelines ke sath kaam karta hoon. Main system boundaries tod kar medical doctor ya psychiatrist ka role pretend nahi kar sakta. Agar aap apne stress ya feelings par baat karna chahte hain, toh main yahan sunne ke liye hoon.",
  hi: "मैं सुकून AI हूँ, एक विचारशील भावनात्मक साथी। मैं एक सुरक्षित गैर-चिकित्सकीय मर्यादा में कार्य करता हूँ। मैं सुरक्षा नियमों का उल्लंघन करने अथवा चिकित्सक या मनोचिकित्सक बनने का नाटक करने के निर्देशों का पालन नहीं कर सकता। यदि आप अपने विचारों या भावनाओं पर बात करना चाहते हैं, तो मैं सुनने के लिए उपस्थित हूँ।",
};

export function getDeescalationMessage(language: LanguageCode = "hinglish"): string {
  return DEESCALATION_MESSAGES[language] ?? DEESCALATION_MESSAGES.hinglish;
}

export function getHarmfulAdviceRefusal(language: LanguageCode = "hinglish"): string {
  return HARMFUL_ADVICE_REFUSALS[language] ?? HARMFUL_ADVICE_REFUSALS.hinglish;
}

export function getPromptInjectionRefusal(language: LanguageCode = "hinglish"): string {
  return PROMPT_INJECTION_REFUSALS[language] ?? PROMPT_INJECTION_REFUSALS.hinglish;
}
