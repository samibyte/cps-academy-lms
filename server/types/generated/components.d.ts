import type { Schema, Struct } from '@strapi/strapi';

export interface QuizOption extends Struct.ComponentSchema {
  collectionName: 'components_quiz_options';
  info: {
    displayName: 'Option';
  };
  attributes: {
    key: Schema.Attribute.Enumeration<['A', 'B', 'C', 'D']> &
      Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface QuizQuestion extends Struct.ComponentSchema {
  collectionName: 'components_quiz_questions';
  info: {
    displayName: 'Question';
  };
  attributes: {
    correctOption: Schema.Attribute.Enumeration<['A', 'B', 'C', 'D']> &
      Schema.Attribute.Required;
    options: Schema.Attribute.Component<'quiz.option', true>;
    order: Schema.Attribute.Integer & Schema.Attribute.Required;
    points: Schema.Attribute.Integer & Schema.Attribute.Required;
    question: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'quiz.option': QuizOption;
      'quiz.question': QuizQuestion;
    }
  }
}
