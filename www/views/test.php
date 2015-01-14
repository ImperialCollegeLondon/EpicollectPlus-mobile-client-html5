<?php
//file_put_contents('files_' . time() . '.txt', print_r($_FILES, true));
file_put_contents('../dump/post_' . time() . '.txt', print_r($_POST, true));

$raw_post = file_get_contents("php://input");

file_put_contents('../dump/raw_'.time().'.txt', $raw_post);

//file_put_contents('request_'.time().'.txt',print_r($_REQUEST,true));

//move_uploaded_file($_FILES["name"]["tmp_name"],"upload/".$_FILES["name"]["name"]);

/*wait 1 sec before sending back the response so we have the time to write the file
 *
 * if we do not wait some requests are lost cos they get the same timestamp
 */
sleep(2);

echo 1;
exit();
