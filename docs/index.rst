FRESH × IRSS + Silva21
======================

A public, static demonstration of how IRSS and Silva21 environmental
intelligence maps into the FRESH forest decision stack: inventory and LiDAR,
climate, disturbance, habitat, carbon, operations, provenance, and storyboards.

The demo is a communication artifact. It shows the seam between two decades of
measurement science and the FRESH decision engines; it is not an operational
tool, a validation report, or a live data product.

- **Live demo:** https://ubc-fresh.github.io/fresh-irss-demo/
- **Source registry:** https://github.com/UBC-FRESH/irss-expansion
- **Code:** https://github.com/UBC-FRESH/fresh-irss-demo

.. toctree::
   :maxdepth: 2
   :caption: Guide

   demo
   evidence
   assistant
   development

.. toctree::
   :maxdepth: 2
   :caption: API

   api/index

What the public slice contains
------------------------------

Eight integration lanes, each with a status from the public registry, a
why-it-matters statement, an explicit boundary, and evidence links to a source
note and a target-repository record.

A small case-study map built from the public FHOPS TFL 6 LidarBC fixture: seven
clipped VRI blocks, one road job, and one landing in a ~100 ha pilot AOI. The
geometry is public; the operational values are synthetic.

A four-row sample of the ``femic.climate.v1`` contract fixture, labelled
synthetic and not observed.

An assistant drawer shell that follows the HectaresBC pattern but is disabled by
default. No model endpoint is configured, so no prompt leaves the browser.

A provenance and limitations panel that states what the page can and cannot
support.
