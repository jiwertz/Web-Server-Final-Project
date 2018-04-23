const inquirer = require('inquirer');

module.exports = {
  getServerEmailInfo: () => {
    const questions = [
      {
        name: 'email',
        type: 'input',
        message: 'Enter the server e-mail address:',
      },
      {
        name: 'password',
        type: 'password',
        message: 'Enter the password:',

      }
    ];
    return inquirer.prompt(questions);
  },
}