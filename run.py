import os
import sys

# Add project root to path so internal modules like backend.app resolve correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.app import create_app

app = create_app()

if __name__ == '__main__':
    # Start the dev server on 5000
    app.run(debug=False, host='0.0.0.0', port=5000)
