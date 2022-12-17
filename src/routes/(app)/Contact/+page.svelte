<script>
  // @ts-nocheck
  import { Card, CardActions, Icon, TextField, Textarea, MaterialApp } from "svelte-materialify"
  import { mdiGoogle, mdiFacebook } from '@mdi/js'


  let comingSoonModalOpen = false
  const openComingSoon = () => {
    if (!comingSoonModalOpen) {
      comingSoonModalOpen = true
    } else {
      comingSoonModalOpen = false
      comingSoonModalOpen = true
    }
  }
</script>

<svelte:head>
  <title>Axion | Contacts</title>
</svelte:head>


<MaterialApp>
  <div class="hero is-fullheight-with-navbar has-background-primary">
    <div class="hero-body bg-color-yaz-blue">
      <!--BANNER-->
      <div class="container is-flex is-flex-direction-column is-justify-content-space-between is-align-items-center">
        <figure class="column is-20-mobile">
          <img src="Icon/banner.png" alt="background" />
        </figure>
      </div>
    </div>

    <!--DEVELOPER-->    
    <div class="hero head m-6">
      <p class="mb-10 is-size-2-tablet is-size-4-mobile has-text-white has-text-weight-bold has-text-centered quicksands">Our Teams are here to help</p>
        <div class="columns is-mobile is-centered is-multiline">

          <div class="d-flex is-align-items-center is-justify-center"> 
            <div class="columns is-mobile is-tablet is-centered is-multiline">
              <!--CM-->  
              <div class=" d-flex flex-wrap">
                <div class="p-1 my-1 mx-1 has-background-black">
                  <Card class="py-5 px-3 " style="max-width:250px;">
                           
                    <!--Image-->           
                      <figure class="my-3 image 4 by 6">
                        <img class="is-rounded" src="Member/Cm.jpg" alt="background" />
                      </figure>
                              
                    <!--Info name-->
                      <div>
                        <p class="has-text-centered fredokaone">
                          Charles Maverick Herrera
                          <br>
                          <small class="has-text-weight-normal is-family-secondary">
                            Technical Lead
                          </small>
                        </p>
                      </div>
      
                    <!--ICON-->
                      <div class="mt-3 is-flex is-justify-content-center">
                        <div class="mx-2">
                          <a href="https://www.facebook.com/SIEMCMSIEM" target="_blank">
                            <Icon class="has-text-info" size="32px" path={mdiFacebook} />
                          </a>
                        </div>
                        
                        <div class="mx-2">
                          <a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=charlesm.herrera0700@gmail.com" target="_blank">
                            <Icon class="has-text-danger-dark" size="32px" path={mdiGoogle} />
                          </a>
                        </div>
                      </div>
                  </Card>
                </div>
              </div>
   
              <!--JOANNE-->
                <div class=" d-flex flex-wrap">
                  <div class="p-1 my-1 mx-1 has-background-black">
                    <Card class="py-5 px-3 has-background-white" style="max-width:250px;">
                             
                      <!--Image-->
                      <figure class="my-3 image 4 by 6">
                        <img class="is-rounded" src="Member/Joanne.jpg" alt="background" />
                      </figure>
                             
                      <!--info name-->
                      <div>
                        <p class="has-text-centered fredokaone">
                            Joanne Razelle L. Roche
                          <br>
                          <small class="has-text-weight-normal is-family-secondary">
                            Front-end Developer
                          </small>
                        </p>
                      </div>
   
                      <!--ICON-->
                      <div class="mt-3 is-flex is-justify-content-center">
                        <div class="mx-2">
                          <a href="https://www.facebook.com/joanne.roche19/" target="_blank">
                            <Icon class="has-text-info" size="32px" path={mdiFacebook} />
                          </a>
                        </div>
                               
                        <div class="mx-2">
                          <a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=rochejoannerazelle@gmail.com" target="_blank">
                            <Icon class="has-text-danger-dark" size="32px" path={mdiGoogle} />
                          </a>
                        </div>
                      </div>  
                    </Card>
                  </div>
                </div>
   
              <!--YAZEN-->
                <div class=" d-flex flex-wrap">
                  <div class="p-1 my-1 mx-1 has-background-black">
                    <Card class="py-5 px-3 has-background-white" style="max-width:250px;">
                             
                      <!--Image-->    
                      <figure class="my-3 image 4 by 6">
                        <img class="is-rounded" src="Member/Yazen.jpg" alt="background" />
                      </figure>
                             
                      <!--Info name-->
                        <div>
                          <p class="has-text-centered fredokaone">
                              Mart Yazen Mikhail Clarin
                            <br>
                            <small class="has-text-weight-normal is-family-secondary">
                              Quality Assurance, Research Lead
                            </small>
                          </p>
                        </div>
   
                      <!--ICON-->
                        <div class="mt-3 is-flex is-justify-content-center">
                          <div class="mx-2">
                            <a href="https://www.facebook.com/yazen.clarin" target="_blank">
                              <Icon class="has-text-info" size="32px" path={mdiFacebook} />
                            </a>
                          </div>

                          <div class="mx-2">
                            <a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=yazenclarin@gmail.com" target="_blank">
                              <Icon class="has-text-danger-dark" size="32px" path={mdiGoogle} />
                            </a>
                          </div>
                        </div>
                    </Card>   
                  </div>
                </div>
   
                <!--ELJOHN-->
                  <div class=" d-flex flex-wrap">
                    <div class="p-1 my-1 mx-1 has-background-black">
                      <Card class="py-5 px-3 has-background-white" style="max-width:250px;">
                             
                        <!--Image-->  
                        <figure class="my-3 image 4 by 6">
                          <img class="is-rounded" src="Member/Eljohn.jpg" alt="background" />
                        </figure>
                             
                        <!--Info name-->   
                        <div>
                          <p class="has-text-centered fredokaone">
                              El John S. Matimtim
                            <br>
                            <small class="has-text-weight-normal is-family-secondary">
                              Quality Assurance Lead
                            </small>
                          </p>
                        </div>
   
                        <!--ICON-->
                          <div class="mt-3 is-flex is-justify-content-center">
                            <div class="mx-2">
                              <a href="https://www.facebook.com/el.john.756859" target="_blank">
                                <Icon class="has-text-info" size="32px" path={mdiFacebook} />
                              </a>
                            </div>

                            <div class="mx-2">
                              <a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=matimtimeljohn@gmail.com" target="_blank">
                                <Icon class="has-text-danger-dark" size="32px" path={mdiGoogle} />
                              </a>
                            </div>
                          </div>  
                      </Card>
                    </div>
                  <div>
            </div>
          </div>
        </div>
    </div>
  </div>

  <div class="hero head mt-16"> 
    <p class="mt-16 is-size-3-tablet is-size-6-mobile has-text-white has-text-weight-bold has-text-centered fredoka-reg">Managing your academic work here in Axion is simple and easy.</p>
    
    <!-- 'Get Started' button (leads to Sign Up) -->
    <div class="is-flex flex-column is-align-items-center">
      <div class="mt-3 mb-10">
       <a 
       data-sveltekit-preload-code='eager'
       href="/Signup" class='button is-medium fredoka-reg has-background-white has-text-primary rounded-lg'>
        Sign up
      </a>
      </div>
    </div>
  </div>
</MaterialApp>


