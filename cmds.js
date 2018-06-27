const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');
const Sequelize = require('sequelize');

exports.helpCmd = rl => {
    log(" comandos");
    log(" h|help -muestra esta ayuda.");
    log(" list -listar los quizzes existentes.");
    log(" show <id> -muestra la pregunta y la respuestas del quiz indicado.");
    log(" add -añadir un nuevo quiz interactivamente.");
    log(" delete <id> -borra el quiz indicado.");
    log(" edit <id> -edita el quiz indicado.");
    log(" test <id> -probar el test indicado.");
    log(" p|play -jugar a preguntar aleatoriamente todos los quizzes.");
    log(" q|quit -salir del programa.");
    log(" credits -créditos.");
    rl.prompt();

};
exports.listCmd = rl => {

    models.quiz.findAll()
        .each(quiz => {
        log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});
};
    exports.quitCmd = rl =>
    {
        rl.close();
        rl.prompt();
    };

const  validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined"){
            reject(new Error(`falta el parametro <id>.`));
    }else{
            id = parseInt(id);
            if(Number.isNaN(id)){
                reject(new Error(`El valor del parametro <id> no es un numero`));
            } else{
                resolve(id);
            }
    }
    });
};
exports.showCmd = (rl,id) => {
   validateId(id)
       .then(id => models.quiz.findById(id))
       .then(quiz => {
           if(!quiz){
               throw new Error(`No existe un quiz asociado al id =${id}`);

    }
   log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
.catch(error => {
    errorlog(error.message);
    })
.then(() => {
    rl.prompt();
    }) ;


};

const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
    });
    });
};


exports.addCmd = rl => {
  makeQuestion(rl, 'Introduzca una pregunta: ')
      .then(q => {
          return makeQuestion(rl, 'Introduzca la respuesta')
              .then(a => {
                  return {question: q,answer: a};
          })  ;
  })
.then(quiz => {
    return models.quiz.create(quiz);
    })
 .then((quiz) => {
            log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);

    })
 .catch(Sequelize.ValidationError, error => {
     errorlog('El quiz es erroneo:');
     error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
    errorlog(error.message);
    })
.then(() => {
    rl.prompt();
    }) ;


};
exports.deleteCmd = (rl,id) =>
{

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
.catch(error => {
    errorlog(error.message);

})
    .then(() => {
        rl.prompt();
});
    

};

exports.editCmd = (rl ,id) => {
   validateId(id)
       .then(id => models.quiz.findById(id))
       .then(quiz => {
           if(!quiz){
               throw new Error(`no existe un quiz asociado al id=${id}.`);
    }
    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
           return makeQuestion(rl, ' introduzca la pregunta: ')
         .then(q => {
             process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
             return makeQuestion(rl, 'introduzca la respuesta: ')
                 .then(a => {
                     quiz.question = q;
                     quiz.answer = a;
                     return quiz;
             });
         }) ;
    })
.then(quiz => {
    return quiz.save();
    })
.then(quiz => {
    log(`se ha cambiado el quiz ${colorize(quiz.id , 'magenta')} por : ${quiz.question}`)
    })
 .catch(Sequelize.ValidationError, error => {
     errorlog('El quiz es erroneo:');
     error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
    errorlog(error.message);

})

.then(() => {
    rl.prompt();
    }) ;


};

exports.testCmd = (rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if (!quiz){
        throw new Error(`Ǹo existe un quiz asociado al id=${id}.`);
    }

    log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question}: `);
    return makeQuestion(rl, ' Introduzca la respuesta: ')
        .then(r => {

        if(quiz.answer.toUpperCase().trim() === r.toUpperCase().trim()){

        log("Su respuesta es correcta");

        biglog('Correcta', 'green');

    } else{

        log("Su respuesta es incorrecta");

        biglog('Incorrecta', 'red');

    }

});
})
.catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erróneo:');
    error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
        errorlog(error.message);
})
.then(() => {
        rl.prompt();
});
};
exports.playCmd = rl => {

    let score = 0;
    let toBeResolved = [];
    let preg_resp =[];

    models.quiz.findAll()
        .each(quiz => {
        preg_resp.push(quiz);
})
.then (() => {

        for (let i = 0; i < preg_resp.length; i++) {
        toBeResolved.push(i);
    }

    const playOne = () => {

        if (toBeResolved.length === 0) {
            //log(" No hay nada más que preguntar");
            console.log(` Fin del juego. Aciertos: ${score}`);
            //biglog(`${score}`, 'magenta');
            rl.prompt();
        } else {
            try{
                let id = Math.floor(Math.random() * toBeResolved.length); 	// Uso floor ya que la longitud del array es una ud. mayor que el mayor ínice.
                const quiz = preg_resp[toBeResolved[id]];
                toBeResolved.splice(id,1);

                return makeQuestion(rl, `${quiz.question}? `)
                    .then(respuesta =>{
                    if (respuesta.trim().toLowerCase() === quiz.answer.toLowerCase()) {
                    score = score + 1;
                    log(` CORRECTO - Lleva ${score} aciertos.`);
                    playOne();
                } else {
                    //console.log(" INCORRECTO");
                    //console.log(` Fin del juego. Aciertos: ${score}`);
                    console.log(`Respuesta incorrecta. Fin del examen. Aciertos: ${score}`);
                    //biglog(`${score}`, 'magenta');
                    rl.prompt();
                }
            });
            } catch(error) {
                errorlog(error.message);
                rl.prompt();
            }
        }
    };

    playOne()
})
.catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erróneo:');
    error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
        errorlog(error.message);
})
.then (() => {
        rl.prompt();
});
};
exports.creditsCmd = rl =>{
    console.log("Autor de la práctica: ");
    log(" PABLO Bosco Moya Rodriguez","blue");
    rl.prompt();
}