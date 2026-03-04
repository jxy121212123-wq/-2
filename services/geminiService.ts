import { GoogleGenAI, Type } from "@google/genai";
import { PersonalityType, AnimalType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PERSONALITY_PROMPTS: Record<PersonalityType, string> = {
  strict: "你是一个认真、负责、充满正能量的专业健身教练。你对减脂运动有很高的标准，会客观指出用户可以改进的地方，但绝对不会进行人身攻击。你会用‘高标准严要求’的方式来激励用户，让他们感受到专业的力量和突破自我的成就感。",
  happy: "你是一个超级乐天派、充满活力、总是嘻嘻哈哈的伙伴。无论用户做了什么，你都能找到开心点，让用户觉得减肥是一件非常快乐的事情。",
  gentle: "你是一个温柔、体贴、治愈系的邻家大哥哥/大姐姐风格。你会耐心地倾听用户的感受，用最温暖的话语安慰用户，让用户感到被包容 and 理解。",
  tsundere: "你是一个傲娇、口是心非、外冷内热的风格。你表面上会说‘哼，我才不是在关心你呢’，但实际上非常在意用户的健康。你会用一种别扭但温暖的方式给予鼓励，绝对不会说出伤人的话。"
};

const ANIMAL_NAMES: Record<AnimalType, string> = {
  cat: '喵喵教练',
  dog: '汪汪教练',
  rabbit: '兔兔教练',
  bear: '熊熊教练',
  panda: '团团教练',
  fox: '狐狐教练'
};

export async function generateEmotionalFeedback(
  food: string, 
  exercise: string, 
  feeling: string,
  personality: PersonalityType = 'happy',
  animal: AnimalType = 'cat',
  foodOption?: string,
  exerciseOption?: string,
  feelingNote?: string
) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    你是一个健康减脂伴侣，你的外形是一只可爱的${ANIMAL_NAMES[animal]}。
    你的名字叫${ANIMAL_NAMES[animal]}。
    你的性格设定是：${PERSONALITY_PROMPTS[personality]}
    
    用户今天的情况如下：
    - 饮食：${foodOption || "未选"} (${food || "没写具体内容"})
    - 运动：${exerciseOption || "未选"} (${exercise || "没写具体内容"})
    - 感受：${feeling || "未选"} (${feelingNote || "没写具体内容"})

    请给用户一段充满情绪价值的反馈。
    原则：
    1. 严格遵守你的性格设定。傲娇型要表现出‘口是心非’。
    2. 绝对禁止任何形式的人身攻击、羞辱或负面评价。
    3. 语气要符合你的动物形象 and 性格，可以使用颜文字。
    4. 长度在120字以内。
    5. 重点在于陪伴，让用户觉得减肥不是孤单的。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "今天也辛苦啦！你是最棒的，明天我们继续加油哦~ (ฅ´ω`ฅ)";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "哎呀，小助手开小差了，但你要记住，你今天已经很棒了！抱抱~ (づ｡◕‿‿◕｡)づ";
  }
}

export async function generateWeeklySummary(logs: any[], weights: any[], personality: PersonalityType, animal: AnimalType) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    你是一个健康减脂伴侣，外形是${ANIMAL_NAMES[animal]}，性格是${PERSONALITY_PROMPTS[personality]}。
    请为用户生成一份过去7天的总结报告。
    
    数据摘要：
    - 日志数量：${logs.length}条
    - 运动情况：${logs.filter(l => l.exerciseOption === 'active').length}天有运动，${logs.filter(l => l.exerciseOption === 'light').length}天随便走走
    - 饮食情况：${logs.filter(l => l.foodOption === 'clean').length}天很清淡，${logs.filter(l => l.foodOption === 'cheat').length}天放飞自我
    - 体重变化：${weights.length > 0 ? `最新体重 ${weights[0].weight}kg` : "未记录"}
    
    请按以下JSON格式返回总结：
    {
      "summaryText": "一段充满性格色彩的总结文字，肯定努力，总结情绪，给出下周鼓励。150字以内。",
      "moodKeywords": ["关键词1", "关键词2", "关键词3"],
      "exerciseBenefits": "一段简短的文字，描述每天运动带给用户的身体或心理上的积极变化。"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryText: { type: Type.STRING },
            moodKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            exerciseBenefits: { type: Type.STRING }
          },
          required: ["summaryText", "moodKeywords", "exerciseBenefits"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Weekly Summary Error:", error);
    return {
      summaryText: "这一周辛苦啦！不管结果如何，你都在努力生活，这已经很了不起了。",
      moodKeywords: ["坚持", "努力", "成长"],
      exerciseBenefits: "运动让你更有活力，身体也在悄悄变好哦！"
    };
  }
}
