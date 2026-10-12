import React from 'react';
import { Text, TextProps } from 'react-native';
import { useDynamicTranslatedText } from '../lib/autoTranslate';
import { Language } from '../types';
import { useTranslation } from 'react-i18next';
import { getLanguageCode } from '../lib/translateEntity';

interface DynamicTextProps extends TextProps {
  text?: string;
  lang?: Language;
  fallback?: string;
}

export const DynamicText: React.FC<DynamicTextProps> = ({
  text,
  lang,
  fallback,
  children,
  ...props
}) => {
  const { i18n } = useTranslation();
  const currentLang = lang || getLanguageCode(i18n?.language);
  const content = text || (typeof children === 'string' ? children : '');
  const translated = useDynamicTranslatedText(content, currentLang);
  return (
    <Text {...props}>
      {translated || fallback || content}
    </Text>
  );
};

export default DynamicText;
