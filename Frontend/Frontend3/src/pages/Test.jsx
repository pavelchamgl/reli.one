// import React from "react";

// const URL_RE =
//   /\bhttps?:\/\/[^\s<]+[^\s<\.)\],:;"']\b/gi; // более-менее аккуратно режет ссылку

// const NUMBER_RE =
//   /(?<!\w)(\d+(?:[.,]\d+)?)(?!\w)/g; // 12, 12.5, 12,5 (без прилипания к буквам)

// export function renderI18nRichText({ text, numberClassName, linkClassName }) {
//   // 1) сначала находим и “вырезаем” ссылки, чтобы внутри URL не подсвечивать цифры
//   const parts = [];
//   let lastIndex = 0;

//   const urlMatches = [...text.matchAll(URL_RE)];

//   const pushTextWithNumbers = (chunk, baseKey) => {
//     let pos = 0;
//     const matches = [...chunk.matchAll(NUMBER_RE)];

//     if (matches.length === 0) {
//       parts.push(chunk);
//       return;
//     }

//     matches.forEach((m, i) => {
//       const value = m[0];
//       const idx = m.index ?? 0;

//       if (idx > pos) parts.push(chunk.slice(pos, idx));

//       parts.push(
//         <span key={`${baseKey}-n-${i}`} className={numberClassName}>
//           {value}
//         </span>
//       );

//       pos = idx + value.length;
//     });

//     if (pos < chunk.length) parts.push(chunk.slice(pos));
//   };

//   if (urlMatches.length === 0) {
//     pushTextWithNumbers(text, "t");
//     return parts;
//   }

//   urlMatches.forEach((m, i) => {
//     const url = m[0];
//     const start = m.index ?? 0;
//     const end = start + url.length;

//     // текст ДО ссылки (с подсветкой чисел)
//     if (start > lastIndex) {
//       const before = text.slice(lastIndex, start);
//       pushTextWithNumbers(before, `b-${i}`);
//     }

//     // сама ссылка
//     parts.push(
//       <a
//         key={`u-${i}`}
//         href={url}
//         className={linkClassName}
//         target="_blank"
//         rel="noopener noreferrer"
//       >
//         {url}
//       </a>
//     );

//     lastIndex = end;
//   });

//   // текст ПОСЛЕ ссылок (с подсветкой чисел)
//   if (lastIndex < text.length) {
//     const after = text.slice(lastIndex);
//     pushTextWithNumbers(after, "a");
//   }

//   return parts;
// }


// import { useTranslation } from "react-i18next";
// // import { renderI18nRichText } from "./renderI18nRichText";
// import styles from "../styles/Test.module.scss"

export default function PolicyText() {
  // const { t } = useTranslation("policy");

  // const text = t("intro.part1"); // обычная строка из JSON

  return (
    <></>
  );
}