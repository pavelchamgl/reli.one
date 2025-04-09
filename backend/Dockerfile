FROM python:3.11

ENV PYTHONUNBUFFERED 1
RUN mkdir /app
WORKDIR /app
ADD . /app

RUN pip install --upgrade pip setuptools wheel

RUN pip install -r requirements.txt