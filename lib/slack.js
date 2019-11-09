const request = require('request');

exports.postMessage = message =>
  new Promise((resolve, reject) => {
    request(
      {
        url: process.env.SLACK_WEBHOOK_URL,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
        }),
      },
      (error, response, body) => {
        if (error) {
          reject(new Error(error));
        } else if (response.statusCode != 200) {
          reject(
            new Error(
              `${response.statusCode} ${response.statusMessage}: ${body}`,
            ),
          );
        } else {
          resolve(response);
        }
      },
    );
  });
