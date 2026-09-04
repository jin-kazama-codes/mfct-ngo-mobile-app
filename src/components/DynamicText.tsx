import React from 'react';
import { Text, TextProps } from 'react-native';
import { useDynamicTranslatedText } from '../lib/autoTranslate';
import { Language } from '../types';

interface DynamicTextProps extends TextProps {
  text?: string;
  lang: Language;
  fallback?: string;
}

export const DynamicText: React.FC<DynamicTextProps> = ({
  text,
  lang,
  fallback,
  children,
  ...props
}) => {
  const content = text || (typeof children === 'string' ? children : '');
  const translated = useDynamicTranslatedText(content, lang);
  return (
    <Text {...props}>
      {translated || fallback || content}
    </Text>
  );
};

export default DynamicText;
