from flask import Flask, render_template, request, jsonify
import os
from datetime import datetime

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/trigger', methods=['POST'])
def trigger():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    trigger_type = request.json.get('type', 'unknown')
    location = request.json.get('location', 'unknown')
    
    print(f"🚨 ALERT! Trigger: {trigger_type} | Time: {timestamp} | Location: {location}")
    
    return jsonify({
        'status': 'success',
        'message': 'Evidence captured!',
        'timestamp': timestamp,
        'trigger_type': trigger_type
    })

@app.route('/save_evidence', methods=['POST'])
def save_evidence():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    data = request.json
    trigger_type = data.get('type', 'unknown')
    location = data.get('location', 'unknown')
    
    filename = f"evidence_{timestamp}.txt"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(filepath, 'w') as f:
        f.write(f"Timestamp  : {timestamp}\n")
        f.write(f"Trigger    : {trigger_type}\n")
        f.write(f"Location   : {location}\n")
    
    print(f"✅ Evidence saved: {filename}")
    
    return jsonify({
        'status': 'success',
        'message': f'Evidence saved as {filename}',
        'timestamp': timestamp
    })

@app.route('/list_evidence', methods=['GET'])
def list_evidence():
    files = os.listdir(UPLOAD_FOLDER)
    return jsonify({
        'status': 'success',
        'files': files
    })

@app.route('/upload_evidence', methods=['POST'])
def upload_evidence():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file'})
    
    file = request.files['file']
    location = request.form.get('location', 'unknown')
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    filename = f"evidence_{timestamp}.webm"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    print(f"✅ Video Evidence saved: {filename} | Location: {location}")
    
    return jsonify({
        'status': 'success',
        'message': f'Evidence saved: {filename}'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)