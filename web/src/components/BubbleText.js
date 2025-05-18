import React from 'react';
import { useTranslation } from 'react-i18next';

export default function BubbleText({
                                       background,
                                       color,
                                       borderColor,
                                       borderWidth,
                                       borderStyle,
                                       bubbleText,
                                       svg
                                   }) {
    const { t } = useTranslation();

    const mergedStyle = {
        background: background || 'linear-gradient(to right, var(--semi-color-tertiary-light-default), var(--semi-color-tertiary-light-hover))',
        color: color || 'var(--semi-color-tertiary)',
        borderColor: borderColor || 'var(--semi-color-tertiary-light-active)',
        borderWidth: borderWidth || '1px',
        borderStyle: borderStyle || 'solid'
    };

    return (
        <div
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm whitespace-nowrap"
            style={mergedStyle}
        >
            {svg && (
                svg
            )}
          <span className="flex items-center">
            {t(bubbleText)}
          </span>
        </div>
    );
}