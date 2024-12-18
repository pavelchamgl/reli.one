import React, { useEffect, useState } from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const CustomBreadcrumbs = ({ product }) => {

  console.log(product);
  
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;

  const [pathnames, setPathnames] = useState(() => {
    const savedPaths = JSON.parse(localStorage.getItem("paths"));
    return savedPaths ? savedPaths : [];
  });

  useEffect(() => {
    let updatedPathnames = JSON.parse(localStorage.getItem("paths")) || [];

    if (pathname === "/") {
      // Если на главной странице, сбрасываем пути
      updatedPathnames = [];
    } else if (!updatedPathnames.some((item) => item.path === pathname)) {
      if (product) {
        // Добавляем продукт в путь
        updatedPathnames.push({
          name: product, // Название продукта
          path: pathname, // Текущий путь
        });
      } else {
        updatedPathnames.push({
          name: pathname.split("/").filter(Boolean).pop(), // Последний сегмент пути
          path: pathname,
        });
      }
    }

    localStorage.setItem("paths", JSON.stringify(updatedPathnames));
    setPathnames(updatedPathnames);
  }, [pathname, product]);

  const handleBreadcrumbClick = (event, to) => {
    event.preventDefault();
    navigate(to);
  };

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link
        color="inherit"
        href="/"
        onClick={(event) => handleBreadcrumbClick(event, "/")}
      >
        Home
      </Link>
      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1;
        return isLast ? (
          <Typography color="textPrimary" key={value.path}>
            {value.name}
          </Typography>
        ) : (
          <Link
            color="inherit"
            href={value.path}
            onClick={(event) => handleBreadcrumbClick(event, value.path)}
            key={value.path}
          >
            {value.name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default CustomBreadcrumbs;
