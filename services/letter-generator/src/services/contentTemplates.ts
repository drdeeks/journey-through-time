// ============================================
// Journey Through Time - Letter Generator Backend
// Matthew's Content Templates
// ============================================

import { LetterTemplate } from '../types';
import { TRUNCATION_CONFIG } from '../config';

// ========== MATTHEW'S TEMPLATES ==========

// These are pre-written letters with Matthew's unique wording and style
// They can be used directly or customized

export const MATTHEWS_TEMPLATES: Record<string, LetterTemplate> = {
  // Default template for Matthew
  matic_message: {
    id: 'matic_message',
    name: "Matthew's Timeless Message",
    title: "A Letter to My Future Self",
    mood: 'hopeful',
    content: `
I'm writing this to you from the past, a moment frozen in time, a thought preserved 
like amber. I don't know where you are right now, or what you're going through, 
but I want you to remember something important.

You are more than the sum of your circumstances. You are the person who has 
survived 100% of their worst days. You are the author of your own story, and 
every chapter, whether it felt like a victory or a defeat, has brought you to this 
point.

I hope you're in a place of peace. I hope you've found the things that light you 
up. I hope you remember to look at the small miracles - the way sunlight filters 
through leaves, the sound of laughter, the quiet moments of connection.

If you're struggling right now, remember this: it's temporary. The pain you feel 
today will be part of your strength tomorrow. And if you're soaring, don't 
forget to look down and see how far you've come.

This is your reminder: you were always worthy. You were always enough. And you 
were always loved.

With timeless affection,
Your past self
`.trim(),
    isPublic: true,
    minLockDays: 30,
    maxLockDays: 365 * 10, // 10 years
    tags: ['inspiration', 'self-love', 'timeless'],
    author: 'Matthew',
  },

  // Short and sweet
  matic_brief: {
    id: 'matic_brief',
    name: "Matthew's Brief Note",
    title: "Quick Reminder",
    mood: 'grateful',
    content: `
Hey you. Yes, you. The one reading this.

I just wanted to say: I'm proud of you.

Things might be hard right now, or they might be amazing. Either way, 
you're here. You're doing it. And that matters.

Keep going.

- Your past self
`.trim(),
    isPublic: false,
    minLockDays: 7,
    maxLockDays: 365,
    tags: ['short', 'encouragement', 'brief'],
    author: 'Matthew',
  },

  // For tough times
  matic_tough_times: {
    id: 'matic_tough_times',
    name: "Matthew's Letter for Hard Days",
    title: "When It Feels Like Too Much",
    mood: 'melancholy',
    content: `
I'm writing this on a day when everything feels heavy. The kind of day where 
getting out of bed takes more energy than you thought you had. And I'm 
reminding you - yes, future you, reading this - that this feeling, this 
weight, it's not forever.

This is the kind of day that will eventually become a story. A story of how 
you made it through. How you put one foot in front of the other, even when 
each step felt like a mountain.

You are not your pain. You are not your struggle. You are the person having 
this experience, and that person - that's you - you are strong enough to carry 
this.

There are people who love you. There are moments waiting for you that you 
cannot possibly imagine right now. There is light at the end of this tunnel, 
even if you can't see it yet.

Hold on. Just a little longer. You've got this.

With compassion,
A version of you who understands
`.trim(),
    isPublic: false,
    minLockDays: 14,
    maxLockDays: 365 * 5,
    tags: ['support', 'hard-times', 'encouragement'],
    author: 'Matthew',
  },

  // For celebrations
  matic_celebration: {
    id: 'matic_celebration',
    name: "Matthew's Celebration Letter",
    title: "Don't Forget to Celebrate",
    mood: 'joyful',
    content: `
STOP. Just stop for a moment.

I need you to do something for me. I need you to look back at where you were 
a year ago. Five years ago. Do you see it? Do you see how far you've come?

You did that. YOU. With all your flaws and fears and doubts, you still managed 
to get here. And that is worth celebrating.

I don't know what you've accomplished between now and then. It might be 
something big and visible to the world, or it might be something quiet and 
personal. Either way, it matters.

You grew. You learned. You survived. And you probably even thrived in ways 
you don't yet recognize.

This is your permission slip: celebrate yourself. Acknowledge your wins. 
Shout them from the rooftops or whisper them to your heart - either way, 
let them in.

You did good. You're doing good. And you'll keep doing good.

Proud of you,
Your biggest fan
`.trim(),
    isPublic: true,
    minLockDays: 30,
    maxLockDays: 365 * 3,
    tags: ['celebration', 'achievement', 'pride'],
    author: 'Matthew',
  },

  // For reflection
  matic_reflection: {
    id: 'matic_reflection',
    name: "Matthew's Reflection Prompt",
    title: "Questions for Future You",
    mood: 'nostalgic',
    content: `
Welcome to this moment, future me. Or future you, if you're not me. Either way,
welcome.

I have some questions for you. Take your time. There are no right answers.

What have you learned about yourself that surprised you?

What did you let go of that you're better without?

What did you hold onto that served you well?

Who came into your life and changed it for the better?

What did you create that you're proud of?

What fear did you face, and how did it go?

What brought you unexpected joy?

What do you wish you could tell your past self?

And most importantly: are you being kind to yourself?

Reflect on these. Or don't. This letter can just be a marker, a statement 
that you were here, you were thinking, you were alive and present in your own 
story.

Either way, I'm glad you're here to read this.

Curiously,
Your past self
`.trim(),
    isPublic: true,
    minLockDays: 90,
    maxLockDays: 365 * 5,
    tags: ['reflection', 'questions', 'self-discovery'],
    author: 'Matthew',
  },

  // Humorous one
  matic_humor: {
    id: 'matic_humor',
    name: "Matthew's Lighthearted Letter",
    title: "Hope You're Laughing",
    mood: 'excited',
    content: `
So, future person. How's it going out there?

I hope you're reading this on some fancy futuristic device. Maybe a hologram? 
Maybe a neural implant? Or maybe just your phone like a normal person. Either 
way, hello from the past!

I'm writing this to remind you that life shouldn't be taken too seriously all 
the time. If you're not laughing at least once a day, you're doing it wrong.

Remember that time you [embarrassing story here]? Yeah, you probably don't 
because I haven't written it yet. But trust me, it was funny in hindsight.

And hey, if things aren't great right now, remember: you're literally reading a 
letter from the past. That makes you a time traveler. And time travelers are 
cool.

So chin up, hero. The world needs your particular brand of weird.

With a smile,
Your past (and hopefully still funny) self
`.trim(),
    isPublic: true,
    minLockDays: 7,
    maxLockDays: 365,
    tags: ['humor', 'fun', 'lighthearted'],
    author: 'Matthew',
  },
};

// ========== TEMPLATE MANAGEMENT ==========

export class TemplateManager {
  private templates: Record<string, LetterTemplate>;
  private customTemplates: Record<string, LetterTemplate> = {};

  constructor() {
    this.templates = { ...MATTHEWS_TEMPLATES };
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): LetterTemplate | undefined {
    return this.templates[templateId] || this.customTemplates[templateId];
  }

  /**
   * Get all template IDs
   */
  getTemplateIds(): string[] {
    return [
      ...Object.keys(this.templates),
      ...Object.keys(this.customTemplates),
    ];
  }

  /**
   * Get all templates
   */
  getAllTemplates(): Record<string, LetterTemplate> {
    return {
      ...this.templates,
      ...this.customTemplates,
    };
  }

  /**
   * Get Matthew's templates specifically
   */
  getMatrixTemplates(): Record<string, LetterTemplate> {
    const matrixTemplates: Record<string, LetterTemplate> = {};
    const allTemplates = this.getAllTemplates();
    
    for (const [id, template] of Object.entries(allTemplates)) {
      if (template.author === 'Matthew' || template.id.startsWith('matic_')) {
        matrixTemplates[id] = template;
      }
    }
    
    return matrixTemplates;
  }

  /**
   * Add or update a custom template
   */
  addTemplate(template: LetterTemplate): void {
    this.customTemplates[template.id] = template;
  }

  /**
   * Remove a custom template
   */
  removeTemplate(templateId: string): boolean {
    if (this.customTemplates[templateId]) {
      delete this.customTemplates[templateId];
      return true;
    }
    return false;
  }

  /**
   * Get templates by tag
   */
  getTemplatesByTag(tag: string): Record<string, LetterTemplate> {
    const result: Record<string, LetterTemplate> = {};
    const allTemplates = this.getAllTemplates();
    
    for (const [id, template] of Object.entries(allTemplates)) {
      if (template.tags.includes(tag)) {
        result[id] = template;
      }
    }
    
    return result;
  }

  /**
   * Get templates by mood
   */
  getTemplatesByMood(mood: string): Record<string, LetterTemplate> {
    const result: Record<string, LetterTemplate> = {};
    const allTemplates = this.getAllTemplates();
    
    for (const [id, template] of Object.entries(allTemplates)) {
      if (template.mood === mood) {
        result[id] = template;
      }
    }
    
    return result;
  }

  /**
   * Select a random template
   */
  getRandomTemplate(): LetterTemplate {
    const allTemplates = this.getAllTemplates();
    const ids = Object.keys(allTemplates);
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    return allTemplates[randomId];
  }

  /**
   * Select a random template by mood
   */
  getRandomTemplateByMood(mood: string): LetterTemplate | undefined {
    const moodTemplates = this.getTemplatesByMood(mood);
    const ids = Object.keys(moodTemplates);
    
    if (ids.length === 0) return undefined;
    
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    return moodTemplates[randomId];
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();
export default templateManager;
