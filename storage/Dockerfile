FROM alpine
RUN apk add --no-cache python3 py3-pip
WORKDIR /app
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt
COPY . ./
CMD ["gunicorn", "app:app", "--bind=0.0.0.0", "--workers=3"]
EXPOSE 8000
