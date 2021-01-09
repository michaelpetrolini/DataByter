# DataByter
SOI-2020 Project- DataByter

Progetto relativo all'esame di Sistemi Orientati ad Internet dell A.A. 2020/2021.

Setup relativo alla VM utilizzata durante il corso:
- copiare il contenuto della cartella front-end all'interno del path /var/www/databyter
- copiare il contenuto della cartella back-end all'interno del path /home/vagrant/Projects/databyter
- aggiungere il file databyter.conf all'interno dela path /etc/apache2/sites-available
- aggiungere il Servername e i relativi alias nel file hosts in /etc
- abilitare il progetto e riavviare Apache
- avviare il server

Il progetto fa uso del database non relazionale MongoDB. Nel folder resources è presente un file default.json. Questo è l'unico document necessario per il funzionamento iniziale del sito. Nel caso si fosse interessati ad una clean install è sufficiente copiare il contenuto del file all'interno della collection 'id-manager' nel database 'databyter' di MongoDB.
Viene anche fornito un backup con all'interno già dei progetti. Per utilizzare il backup è sufficiente eseguire il comando 'mongorestore' puntando al folder resources/mongo-backup.
