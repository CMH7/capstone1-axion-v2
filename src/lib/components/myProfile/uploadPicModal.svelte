<script>
  //@ts-nocheck
  import { uploadPicModalActive } from '$lib/stores/myProfile.store';
  import { Dialog, Icon, Button } from 'svelte-materialify'
  import { mdiClose, mdiUpload } from '@mdi/js'
	import { applyAction, deserialize, enhance } from '$app/forms';
	import { notifs } from '$lib/stores/global.store';
	import { invalidateAll } from '$app/navigation';
	import { Moon } from 'svelte-loading-spinners';

  export let data

  let files = []
  let rawData
  let uploading = false
  let fileName = ''
  let fileType = ''

  const close = () => {
    uploadPicModalActive.set(false)
    files = []
  }

  const handleUpload = (e) => {
    let reader = new FileReader();
    reader.onloadend = () => {
      rawData = reader.result
      fileName = e.target.files[0].name
      fileType = e.target.files[0].type
    };
    reader.readAsDataURL(e.target.files[0]);
  }

  const savePic = async () => {
    if(uploading) return
    if(files.length == 0) return
    uploading = true

    let form = document.getElementById('formNewPic')
    const data2 = new FormData(form);

    const response = await fetch(form.action, {
      method: 'POST',
      body: data2
    });

    /** @type {import('@sveltejs/kit').ActionResult} */
    const result = deserialize(await response.text());

    console.log(result);

    if(result.type === 'invalid') {
      $notifs = [...$notifs, {
        msg: result.data.message,
        type: `${result.data.reason === 'databaseError' ? 'stayError' : 'error'}`,
        id: `${(Math.random() * 999) + 1}`
      }]
    }

    if (result.type === 'success') {
      // re-run all `load` functions, following the successful update
      await invalidateAll();
    }

    applyAction(result);
    uploading = false
    if(result.type === 'success') {
      $notifs = [...$notifs, {
        msg: 'Changed successfully',
        type: 'successs',
        id: `${(Math.random() * 999) + 1}`
      }]
      close()
    }
  }
</script>

<Dialog persistent bind:active={$uploadPicModalActive} class="has-background-white-bis is-flex is-flex-direction-column p-2">
  <div class="is-flex is-justify-content-space-between is-align-items-center maxmins-w-100p">
    <!-- title -->
    <div class="fredoka-reg">
      Upload new profile
    </div>

    <!-- close button -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <Button
      on:click={close}
      icon
      size='small'
    >
      <Icon class="red-text" path={mdiClose} />
    </Button>
  </div>

  {#if files.length == 0}
    <div class="mt-3 maxmins-w-100p centerxy">
      <form action="?/newPic" id='formNewPic' use:enhance>
        <label for="inputproa" class="is-clickable px-3 py-2 rounded has-background-grey-lighter custom-file-upload">
          <div class="is-flex">
            <Icon path={mdiUpload} />
            <div class="ml-3">
              Upload new profile picture
            </div>
          </div>
        </label>
        <input accept=".jpg, .png, .jpeg, .gif" type="file" id='inputproa' name='filesa' hidden on:change={handleUpload} bind:files>
      </form>
    </div>
  {:else}
    <form action="?/newPic" id='formNewPic' class='is-hidden' use:enhance>
      <input type="text" name='rawData' bind:value={rawData}>
      <input type="text" name='userID' bind:value={data.user.id}>
      <input type="text" name='fileName' bind:value={fileName}>
      <input type="text" name='fileType' bind:value={fileType}>
    </form>

    <div class="maxmins-w-100p mt-3 centerxy">
      <figure class="image is-128x128 centerxy rounded-circle is-clipped has-background-white is-relative" style="border: 1px solid rgba(0, 0, 0, 0.3)">
        <img height="128px" class='maxmins-w-100p' src="{rawData}" alt='Pic'>
      </figure>
    </div>

    <div class='maxmins-w-100p is-flex is-justify-content-flex-end mt-3'>
      {#if !uploading}
        <Button text size='small' on:click={() => files = []}>
          Remove
        </Button>
        <Button text size='small' class='ml-3 has-background-success' on:click={savePic}>
          Save
        </Button>
      {:else}
        <Moon size={30} color='#000' />
      {/if}
    </div>
  {/if}

</Dialog>

<style>
  .custom-file-upload {
    display: inline-block;
  }
</style>