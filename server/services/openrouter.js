const https = require('https');
require('dotenv').config();

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    this.baseUrl = 'openrouter.ai';
  }

  async makeRequest(messages, systemPrompt = '') {
    return new Promise((resolve, reject) => {
      const requestBody = JSON.stringify({
        model: this.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 10000
      });

      const options = {
        hostname: this.baseUrl,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Education Suite'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              reject(new Error(response.error.message || 'OpenRouter API error'));
            } else {
              resolve(response);
            }
          } catch (err) {
            reject(new Error('Failed to parse OpenRouter response'));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(requestBody);
      req.end();
    });
  }

  // Grade an essay
  async gradeEssay(title, content) {
    const systemPrompt = `You are an expert essay grader and writing instructor. Analyze essays thoroughly and provide constructive feedback. Always respond in valid JSON format.`;

    const userPrompt = `Please grade the following essay and provide detailed feedback.

Title: ${title}

Essay Content:
${content}

Respond with a JSON object in this exact format:
{
  "grade": "A/A-/B+/B/B-/C+/C/C-/D/F",
  "score": (0-100 numeric score),
  "feedback": "Overall assessment paragraph",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area for improvement 1", "area for improvement 2", "area for improvement 3"],
  "grammarIssues": ["issue 1 if any", "issue 2 if any"],
  "structure": {
    "introduction": "feedback on introduction",
    "body": "feedback on body paragraphs",
    "conclusion": "feedback on conclusion"
  },
  "writingStyle": "assessment of writing style and voice"
}`;

    try {
      const response = await this.makeRequest([{ role: 'user', content: userPrompt }], systemPrompt);
      const content = response.choices[0].message.content;
      return {
        success: true,
        data: this.parseJsonResponse(content),
        rawResponse: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate music lesson
  async generateMusicLesson(instrument, skillLevel, topic) {
    const systemPrompt = `You are an expert music teacher with decades of experience teaching various instruments. Provide clear, structured lessons with practical exercises. Always respond in valid JSON format.`;

    const userPrompt = `Create a comprehensive music lesson for the following:

Instrument: ${instrument}
Student Skill Level: ${skillLevel}
Topic: ${topic}

Respond with a JSON object in this exact format:
{
  "lessonTitle": "Title of the lesson",
  "objectives": ["learning objective 1", "learning objective 2", "learning objective 3"],
  "warmup": {
    "description": "Warmup exercise description",
    "duration": "5-10 minutes"
  },
  "mainContent": {
    "theory": "Theoretical concepts to understand",
    "technique": "Technical skills to develop",
    "demonstration": "Step-by-step instructions"
  },
  "exercises": [
    {
      "name": "Exercise name",
      "description": "How to perform the exercise",
      "repetitions": "Number of times or duration"
    }
  ],
  "practiceRoutine": {
    "daily": "Daily practice suggestions",
    "weekly": "Weekly goals"
  },
  "tips": ["helpful tip 1", "helpful tip 2", "helpful tip 3"],
  "commonMistakes": ["mistake to avoid 1", "mistake to avoid 2"],
  "nextSteps": "What to learn after mastering this lesson"
}`;

    try {
      const response = await this.makeRequest([{ role: 'user', content: userPrompt }], systemPrompt);
      const content = response.choices[0].message.content;
      return {
        success: true,
        data: this.parseJsonResponse(content),
        rawResponse: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate quiz
  async generateQuiz(title, subject, difficulty, sourceContent, numQuestions) {
    const systemPrompt = `You are an expert educator who creates engaging and educational quizzes. Create questions that test understanding, not just memorization. Always respond in valid JSON format.`;

    const userPrompt = `Create a quiz based on the following parameters:

Title: ${title}
Subject: ${subject}
Difficulty: ${difficulty}
Number of Questions: ${numQuestions}
${sourceContent ? `Source Content: ${sourceContent}` : 'Create general knowledge questions for this subject.'}

Respond with a JSON object in this exact format:
{
  "quizTitle": "${title}",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "totalQuestions": ${numQuestions},
  "estimatedTime": "X minutes",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ],
  "instructions": "Instructions for taking this quiz"
}

Generate exactly ${numQuestions} questions with varied difficulty within the ${difficulty} level.`;

    try {
      const response = await this.makeRequest([{ role: 'user', content: userPrompt }], systemPrompt);
      const content = response.choices[0].message.content;
      return {
        success: true,
        data: this.parseJsonResponse(content),
        rawResponse: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Analyze reading level
  async analyzeReadingLevel(title, content) {
    const systemPrompt = `You are an expert in readability analysis and educational content assessment. Analyze text complexity and provide detailed reading level assessments. Always respond in valid JSON format.`;

    const userPrompt = `Analyze the reading level of the following text:

Title: ${title}

Content:
${content}

Respond with a JSON object in this exact format:
{
  "title": "${title}",
  "readingLevel": "Elementary/Middle School/High School/College/Graduate/Professional",
  "gradeLevel": "Specific grade level (e.g., '5th Grade', '10th Grade', 'College Freshman')",
  "difficultyScore": (1-100 numeric score),
  "metrics": {
    "fleschKincaid": "Estimated Flesch-Kincaid grade level",
    "averageSentenceLength": "Average words per sentence",
    "averageWordLength": "Average syllables per word",
    "vocabularyLevel": "Basic/Intermediate/Advanced/Technical"
  },
  "vocabularyAnalysis": {
    "complexity": "Simple/Moderate/Complex/Highly Technical",
    "technicalTerms": ["list of technical or advanced terms found"],
    "suggestions": "Vocabulary recommendations"
  },
  "sentenceAnalysis": {
    "complexity": "Simple/Compound/Complex",
    "averageLength": "Short/Medium/Long",
    "varietyScore": "Low/Medium/High"
  },
  "targetAudience": "Description of ideal reader",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "summary": "Overall assessment of the text's readability"
}`;

    try {
      const response = await this.makeRequest([{ role: 'user', content: userPrompt }], systemPrompt);
      const content = response.choices[0].message.content;
      return {
        success: true,
        data: this.parseJsonResponse(content),
        rawResponse: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create learning path
  async createLearningPath(title, subject, currentLevel, targetLevel, goals) {
    const systemPrompt = `You are an expert curriculum designer and educational consultant. Create comprehensive, personalized learning paths that are practical and achievable. Always respond in valid JSON format.`;

    const userPrompt = `Create a personalized learning path based on the following:

Title: ${title}
Subject: ${subject}
Current Level: ${currentLevel}
Target Level: ${targetLevel}
Goals: ${goals || 'General mastery of the subject'}

Respond with a JSON object in this exact format:
{
  "pathTitle": "${title}",
  "subject": "${subject}",
  "overview": "Brief description of this learning journey",
  "estimatedDuration": "X weeks/months",
  "prerequisites": ["prerequisite 1", "prerequisite 2"],
  "phases": [
    {
      "phase": 1,
      "name": "Phase name",
      "duration": "X weeks",
      "focus": "Main focus of this phase",
      "topics": ["topic 1", "topic 2", "topic 3"],
      "milestones": ["milestone 1", "milestone 2"],
      "resources": [
        {
          "type": "video/book/course/practice",
          "title": "Resource title",
          "description": "Why this resource is helpful"
        }
      ]
    }
  ],
  "weeklySchedule": {
    "hoursPerWeek": "Recommended hours",
    "breakdown": {
      "theory": "X hours",
      "practice": "X hours",
      "projects": "X hours"
    }
  },
  "assessments": ["how to measure progress"],
  "finalProject": {
    "title": "Capstone project title",
    "description": "What you'll build/create to demonstrate mastery"
  },
  "tips": ["success tip 1", "success tip 2", "success tip 3"],
  "nextSteps": "What to pursue after completing this path"
}`;

    try {
      const response = await this.makeRequest([{ role: 'user', content: userPrompt }], systemPrompt);
      const content = response.choices[0].message.content;
      return {
        success: true,
        data: this.parseJsonResponse(content),
        rawResponse: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate language immersion lesson
  async generateLanguageImmersion(targetLanguage, nativeLanguage, proficiencyLevel, topic, sessionType) {
    const systemPrompt = `You are an expert polyglot language teacher specializing in immersive language learning. You teach ${targetLanguage} to ${nativeLanguage} speakers. Create engaging, practical lessons with authentic language usage. Always respond in valid JSON format.`;

    const sessionDescriptions = {
      conversation: 'a realistic conversation dialogue with translations',
      vocabulary: 'a focused vocabulary building lesson',
      grammar: 'a clear grammar explanation with examples',
      reading: 'a reading comprehension passage with questions',
      culture: 'a cultural immersion lesson with language context',
      travel: 'essential travel phrases and scenarios',
      business: 'professional/business language and etiquette'
    };

    const sessionFocus = sessionDescriptions[sessionType] || sessionDescriptions.conversation;

    const userPrompt = `Create ${sessionFocus} for learning ${targetLanguage}.

Target Language: ${targetLanguage}
Native Language: ${nativeLanguage}
Proficiency Level: ${proficiencyLevel}
Topic: ${topic}
Session Type: ${sessionType}

Respond with a JSON object in this exact format:
{
  "lessonTitle": "Title in ${targetLanguage} (${nativeLanguage} translation)",
  "lessonContent": "Main lesson content - dialogue, passage, or explanation. Include both ${targetLanguage} text and ${nativeLanguage} translations. Use line breaks for readability.",
  "vocabulary": [
    {
      "word": "word/phrase in ${targetLanguage}",
      "translation": "translation in ${nativeLanguage}",
      "pronunciation": "phonetic pronunciation guide",
      "example": "example sentence using the word in ${targetLanguage}"
    }
  ],
  "grammarNotes": "Key grammar points covered in this lesson, explained clearly for ${proficiencyLevel} learners",
  "exercises": [
    {
      "type": "Translation/Fill-in-the-blank/Matching/Sentence Construction",
      "instruction": "What the student should do",
      "question": "The exercise question or prompt",
      "answer": "The correct answer"
    }
  ],
  "pronunciationGuide": "Specific pronunciation tips for sounds in this lesson that ${nativeLanguage} speakers commonly struggle with",
  "culturalNotes": "Cultural context, customs, or etiquette related to this topic in ${targetLanguage}-speaking regions",
  "usefulExpressions": [
    {
      "expression": "common expression in ${targetLanguage}",
      "meaning": "meaning in ${nativeLanguage}",
      "usage": "when/how to use it"
    }
  ],
  "practiceScenario": "A role-play scenario the student can practice with",
  "nextSteps": "What to study next to build on this lesson"
}

Generate 8-12 vocabulary items and 4-6 exercises appropriate for ${proficiencyLevel} level.`;

    try {
      const response = await this.makeRequest([{ role: 'user', content: userPrompt }], systemPrompt);
      const content = response.choices[0].message.content;
      return {
        success: true,
        data: this.parseJsonResponse(content),
        rawResponse: response
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Parse JSON response, handling markdown code blocks
  parseJsonResponse(content) {
    try {
      // Remove markdown code blocks if present
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        jsonStr = content.replace(/```\n?/g, '');
      }
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      // Return the raw content if JSON parsing fails
      return { rawContent: content, parseError: 'Could not parse as JSON' };
    }
  }
}

module.exports = new OpenRouterService();
