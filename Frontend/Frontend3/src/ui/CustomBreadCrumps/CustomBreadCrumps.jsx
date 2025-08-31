import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import styles from "./CustomBread.module.scss"

const CustomBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { product } = useSelector((state) => state.products);

  const [pathnames, setPathnames] = useState([]);

  const { t } = useTranslation()

  const searchParams = new URLSearchParams(location.search);
  const searchText = searchParams.get("categoryValue");
  const categoryID = searchParams.get("categoryID");

  // Очистка путей при выборе новой категории
  useEffect(() => {
    const prevCategoryID = localStorage.getItem("prevCategoryID");

    if (pathname.includes("/product_category") && categoryID && categoryID !== prevCategoryID) {
      localStorage.removeItem("paths");
      localStorage.setItem("prevCategoryID", categoryID);
      setPathnames([]);
    }

    if (pathname === "/") {
      localStorage.removeItem("paths");
      localStorage.removeItem("prevCategoryID");
      setPathnames([]);
    }
  }, [pathname, categoryID]);

  // Загружаем пути из localStorage при монтировании
  useEffect(() => {
    const savedPaths = JSON.parse(localStorage.getItem("paths")) || [];
    setPathnames(savedPaths);
  }, []);

  // Добавляем текущий путь в breadcrumb, если он новый
  useEffect(() => {
    setPathnames((prevPathnames) => {
      let updatedPathnames = [...prevPathnames];

      if (pathname !== "/") {
        let lastSegment = pathname.split("/").filter(Boolean).pop();
        let isCategory = false;
        let categoryName = "";

        if (!isNaN(lastSegment)) {
          if (!searchText) {
            lastSegment = product.name;
          } else {
            lastSegment = t(`categories.${categoryID}`, { defaultValue: searchText.split("!")[0] });
            isCategory = true;
            categoryName = lastSegment;
          }
        }

        const exists = updatedPathnames.some((item) => item.path === pathname);
        if (!exists) {
          updatedPathnames.push({
            name: lastSegment, // оригинальное название товара
            path: pathname,
            category: isCategory,
            categoryName: searchText, // оригинальное название категории
            categoryID: categoryID,   // чтобы t() брал ключ
          });
        }
      }

      localStorage.setItem("paths", JSON.stringify(updatedPathnames));
      return updatedPathnames;
    });
  }, [pathname, product, searchText]);

  const handleBreadcrumbClick = (event, to, category, name) => {
    event.preventDefault();
    navigate(category ? `${to}?categoryValue=${encodeURIComponent(name)}` : to);
  };

  const truncateText = (text, maxLength) =>
    text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

  return (
    <div className={styles.main}>
      <Breadcrumbs aria-label="breadcrumb"
        maxItems={4}
        itemsBeforeCollapse={1}
        itemsAfterCollapse={2}
      >
        <Link
          color="inherit"
          href="/"
          onClick={(event) => handleBreadcrumbClick(event, "/")}
        >
          Home
        </Link>
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const displayName = value.category
            ? t(`categories.${value.categoryID}`, { defaultValue: value.categoryName })
            : value.name;

          return isLast ? (
            <Typography color="textPrimary" key={value.path}>
              {truncateText(displayName || "", 10)}
            </Typography>
          ) : (
            <Link
              color="inherit"
              href={value.path}
              onClick={(event) =>
                handleBreadcrumbClick(
                  event,
                  value.path,
                  value?.category,
                  value?.categoryName
                )
              }
              key={value.path}
            >
              {truncateText(displayName || "", 20)}
            </Link>
          );
        })}
      </Breadcrumbs>
    </div>
  );
};

export default CustomBreadcrumbs;
