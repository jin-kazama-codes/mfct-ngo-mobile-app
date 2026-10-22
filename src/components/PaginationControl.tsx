import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getLanguageCode } from '../lib/translateEntity';

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  lang?: 'hi' | 'ur' | 'en';
  containerClassName?: string;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  lang: propLang,
  containerClassName = '',
}) => {
  const { i18n } = useTranslation();
  const lang = propLang || getLanguageCode(i18n?.language);

  if (totalItems <= 0 || totalPages <= 1) {
    return null;
  }

  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  const prevText = lang === 'hi' ? 'पिछला' : lang === 'ur' ? 'پچھلا' : 'Prev';
  const nextText = lang === 'hi' ? 'अगला' : lang === 'ur' ? 'اگلا' : 'Next';

  const pageLabel =
    lang === 'hi'
      ? `पृष्ठ ${validCurrentPage} / ${totalPages}`
      : lang === 'ur'
      ? `صفحہ ${validCurrentPage} / ${totalPages}`
      : `Page ${validCurrentPage} of ${totalPages}`;

  const rangeLabel = `(${startItem}–${endItem} / ${totalItems})`;

  const canGoPrev = validCurrentPage > 1;
  const canGoNext = validCurrentPage < totalPages;

  return (
    <View
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 my-3 flex-row items-center justify-between shadow-sm ${containerClassName}`}
    >
      {/* Prev Button */}
      <TouchableOpacity
        onPress={() => onPageChange(validCurrentPage - 1)}
        disabled={!canGoPrev}
        activeOpacity={0.7}
        className={`px-3 py-2 rounded-xl flex-row items-center gap-1.5 border ${
          !canGoPrev
            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-40'
            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
        }`}
      >
        <ChevronLeft size={16} color={!canGoPrev ? '#94a3b8' : '#059669'} />
        <Text
          className={`text-xs font-bold ${
            !canGoPrev ? 'text-slate-400 dark:text-slate-500' : 'text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {prevText}
        </Text>
      </TouchableOpacity>

      {/* Center Details */}
      <View className="items-center px-2">
        <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {pageLabel}
        </Text>
        <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
          {rangeLabel}
        </Text>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        onPress={() => onPageChange(validCurrentPage + 1)}
        disabled={!canGoNext}
        activeOpacity={0.7}
        className={`px-3 py-2 rounded-xl flex-row items-center gap-1.5 border ${
          !canGoNext
            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-40'
            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
        }`}
      >
        <Text
          className={`text-xs font-bold ${
            !canGoNext ? 'text-slate-400 dark:text-slate-500' : 'text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {nextText}
        </Text>
        <ChevronRight size={16} color={!canGoNext ? '#94a3b8' : '#059669'} />
      </TouchableOpacity>
    </View>
  );
};

export default PaginationControl;
