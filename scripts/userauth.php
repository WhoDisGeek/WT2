<?php
	extract($_GET);
	header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
	$inputcontent=explode("/",$username);
	if(file_get_contents("../editor/repository/".$inputcontent[0]."-Auth.txt")==""){
		$file=fopen("../editor/repository/".$inputcontent[0]."-Auth.txt","a");
		fwrite($file,$inputcontent[1]);
		fclose($file);
	}
	else{
		$file=fopen("../editor/repository/".$inputcontent[0]."-Auth.txt","a");
		fwrite($file,';'.$inputcontent[1]);
		fclose($file);
	}
	sleep(3);
	$im=imagecreate(1,1);
	imagecolorallocate($im,0,0,0);
	imagejpeg($im);
?>