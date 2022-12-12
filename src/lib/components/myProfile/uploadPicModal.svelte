<script>
  import { uploadPicModalActive } from '$lib/stores/myProfile.store';
  import { Dialog, Icon, Button } from 'svelte-materialify'
  import { mdiClose, mdiUpload } from '@mdi/js'
  import uploadPic from '$lib/configs/helpers/uploadPic';
	import { enhance } from '$app/forms';

  export let data

  //@ts-ignore
  let input
  let files = []
  let rawData

  $: console.log(rawData);

  const close = () => {
    uploadPicModalActive.set(false)
    files = []
  }

  const handleUpload = ()=>{
    let image = files[0];
    let reader = new FileReader();
    reader.onloadend = a => {
      console.log(a);
      rawData = reader.result
    };
    reader.readAsDataURL(image);
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
        <label for="inputpro" class="is-clickable px-3 py-2 rounded has-background-grey-lighter custom-file-upload">
          <div class="is-flex">
            <Icon path={mdiUpload} />
            <div class="ml-3">
              Upload new profile picture
            </div>
          </div>
        </label>
        <input accept=".jpg, .jpeg, .png, .gif" type="file" id='inputpro' name='files' hidden bind:files bind:this={input} on:change={handleUpload}>
      </form>
    </div>
  {:else if files.length != 0 && files[0]}
    <div class="maxmins-w-100p mt-3 centerxy">
      <figure class="image is-128x128 centerxy rounded-circle is-clipped has-background-white is-relative" style="border: 1px solid rgba(0, 0, 0, 0.3)">
        <img class='has-ratio maxmins-w-100p maxmins-h-100p' src="{rawData}" alt='Pic'>
      </figure>
    </div>
  {/if}

  <div class='maxmins-w-100p is-flex is-justify-content-flex-end'>
    <Button text>
      Save
    </Button>
  </div>
</Dialog>

<style>
  .custom-file-upload {
    display: inline-block;
  }
</style>