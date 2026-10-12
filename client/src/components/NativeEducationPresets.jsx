import React from 'react';
export const educationExamples = {
  "Essays": [
    {
      "title": "Why school gardens matter",
      "content": "School gardens offer students a practical way to study science. Planting seeds shows how water, sunlight, and soil support growth. Maintaining a garden also develops teamwork and responsibility. A school could begin with a small raised bed and evaluate the learning benefits over one term."
    },
    {
      "title": "Should students have a later start time?",
      "content": "A later school start could help students arrive rested and ready to learn. Families and transport staff would need time to adapt to the schedule. A pilot program could measure attendance, student feedback, and lesson engagement before a permanent decision."
    },
    {
      "title": "Learning through community projects",
      "content": "Community projects connect classroom ideas with local needs. Students can investigate a problem, consult residents, and propose a practical improvement. Teachers should provide clear milestones and a reflection activity so each learner can demonstrate their contribution."
    }
  ],
  "Reading": [
    {
      "title": "A community library project",
      "content": "Residents met on Saturday to discuss the old railway building. They proposed a community library with a quiet reading room, accessible entrances, and a small garden. Volunteers offered to catalog donated books. The committee agreed to review costs before choosing a date."
    },
    {
      "title": "Rainwater in the garden",
      "content": "A rain barrel collects water from a roof. A screened opening keeps leaves out, and an overflow pipe directs excess water away from the house. Stored water can support garden plants during dry periods. Local guidance determines which uses are appropriate."
    },
    {
      "title": "The unexpected postcard",
      "content": "Maya found a postcard tucked inside a used book. It showed a lighthouse and a message about returning before winter. Curious about its owner, she asked the bookseller where the collection had come from. The answer led her to a nearby history society."
    }
  ],
  "Music": [
    {
      "instrument": "Piano",
      "skill_level": "Beginner",
      "topic": "Practice C major chords and steady quarter-note rhythm with a 15-minute daily routine."
    },
    {
      "instrument": "Guitar",
      "skill_level": "Intermediate",
      "topic": "Develop clean chord transitions, alternate picking, and a simple 12-bar blues progression."
    },
    {
      "instrument": "Violin",
      "skill_level": "Advanced",
      "topic": "Improve phrasing, bow control, and intonation using a short lyrical study and a practice journal."
    }
  ],
  "Quizzes": [
    {
      "title": "Plant growth essentials",
      "subject": "Science",
      "difficulty": "Easy",
      "num_questions": 5,
      "source_content": "Plants use sunlight, water, and carbon dioxide to produce sugars. Roots absorb water and minerals. Leaves contain chlorophyll and exchange gases through small openings."
    },
    {
      "title": "Fractions in everyday life",
      "subject": "Mathematics",
      "difficulty": "Medium",
      "num_questions": 8,
      "source_content": "Equivalent fractions represent the same quantity. A common denominator allows addition. Multiplication of fractions multiplies numerators and denominators. Recipes and distances provide practical examples."
    },
    {
      "title": "Evaluating a historical account",
      "subject": "History",
      "difficulty": "Hard",
      "num_questions": 10,
      "source_content": "Historical accounts should be evaluated by identifying the author, date, intended audience, and available evidence. Primary sources offer firsthand perspectives. Comparing independent accounts helps reveal uncertainty and bias."
    }
  ],
  "Learning": [
    {
      "title": "Web fundamentals",
      "subject": "Programming",
      "current_level": "Beginner",
      "target_level": "Intermediate",
      "goals": "Create an accessible three-page website using HTML, CSS, and JavaScript. Practice three times a week and finish with a portfolio review."
    },
    {
      "title": "Practical data analysis",
      "subject": "Data Science",
      "current_level": "Intermediate",
      "target_level": "Advanced",
      "goals": "Clean a sample dataset, compare summary statistics, create charts, and document assumptions. Build one reproducible analysis over six weeks."
    },
    {
      "title": "Clear professional presentations",
      "subject": "Communication",
      "current_level": "Beginner",
      "target_level": "Advanced",
      "goals": "Plan, rehearse, and deliver a five-minute presentation. Improve audience focus, visual clarity, and responses to questions through weekly feedback."
    }
  ],
  "LanguageImmersion": [
    {
      "target_language": "Spanish",
      "native_language": "English",
      "proficiency_level": "Beginner (A1)",
      "topic": "Introduce yourself and ask for directions using short polite phrases.",
      "session_type": "conversation"
    },
    {
      "target_language": "French",
      "native_language": "English",
      "proficiency_level": "Intermediate (B1)",
      "topic": "Describe a recent trip and compare transport options with past-tense practice.",
      "session_type": "travel"
    },
    {
      "target_language": "German",
      "native_language": "English",
      "proficiency_level": "Upper Intermediate (B2)",
      "topic": "Discuss an appointment schedule and clarify expectations in a professional meeting.",
      "session_type": "business"
    }
  ]
};
export default function NativeEducationPresets({ onApply, disabled = false }) {
  return <div className="ai-preset-bar"><div><strong>Complete AI examples</strong><p>Each choice fills every editable field, including optional inputs. Review before running.</p></div><div className="ai-actions">{['Learning basics', 'Focused practice', 'Advanced review'].map((label,index) => <button type="button" className="btn btn-secondary" key={label} disabled={disabled} onClick={() => onApply(index)}>{label}</button>)}</div></div>;
}
